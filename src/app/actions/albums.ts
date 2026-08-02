"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  albumCreateInputFromFormData,
  validateAlbumCreateInput,
  type AlbumCreateFormState,
  type AlbumUploadFormState,
} from "@domain/albums";
import { createAlbum, uploadAlbumMedia } from "@/server/albums/service";
import { getCurrentUser } from "@/server/auth/session";

export async function createAlbumAction(
  _previousState: AlbumCreateFormState,
  formData: FormData,
): Promise<AlbumCreateFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Inicia sesión para crear un álbum."] } };

  const validation = validateAlbumCreateInput(albumCreateInputFromFormData(formData));
  if (!validation.success) return { errors: validation.errors };

  try {
    const result = await createAlbum(user.id, validation.data);
    if (!result.ok) return { errors: { form: ["No tienes permiso para crear álbumes."] } };

    revalidatePath("/albums");
    redirect(`/albums/${encodeURIComponent(result.id)}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { errors: { form: ["No se pudo crear el álbum. Inténtalo de nuevo."] } };
  }
}

export async function uploadAlbumMediaAction(
  _previousState: AlbumUploadFormState,
  formData: FormData,
): Promise<AlbumUploadFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: ["Tu sesión ha caducado."] } };

  const albumId = typeof formData.get("albumId") === "string" ? String(formData.get("albumId")).trim() : "";
  const title = typeof formData.get("title") === "string" ? String(formData.get("title")).trim() : "";
  const file = formData.get("file");

  if (!albumId) return { errors: { form: ["Álbum no válido."] } };
  if (!(file instanceof File) || file.size === 0) {
    return { errors: { file: ["Selecciona una imagen (JPG, PNG, GIF o WebP)."] } };
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await uploadAlbumMedia(user.id, albumId, {
      title,
      fileName: file.name || "upload.jpg",
      mimeType: file.type || "",
      bytes,
    });

    if (!result.ok) {
      return {
        errors: {
          form: [
            result.reason === "too_large"
              ? "La imagen supera el límite de 5 MB."
              : result.reason === "unsupported_type"
                ? "Formato no permitido. Usa JPG, PNG, GIF o WebP."
                : result.reason === "forbidden"
                  ? "No puedes subir archivos a este álbum."
                  : result.reason === "not_found"
                    ? "No se encontró el álbum."
                    : "No se pudo subir el archivo.",
          ],
        },
      };
    }

    revalidatePath(`/albums/${encodeURIComponent(albumId)}`);
    revalidatePath("/albums");
    revalidatePath("/admin/albums");
    return { success: true, message: "Imagen añadida al álbum." };
  } catch {
    return { errors: { form: ["No se pudo subir el archivo. Inténtalo de nuevo."] } };
  }
}

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}
