import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Descarga de archivos (PDFs) multiplataforma.
 * - Web: descarga clásica via object URL.
 * - Android: escribe en caché y abre el share sheet para guardar/compartir.
 */
@Injectable({
  providedIn: 'root',
})
export class FileDownloadService {
  async saveBlob(blob: Blob, filename: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      this.webDownload(blob, filename);
      return;
    }
    try {
      const base64 = await this.blobToBase64(blob);
      await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
        recursive: true,
      });
      const uri = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
      await Share.share({
        title: filename,
        url: uri.uri,
        dialogTitle: 'Guardar o compartir',
      });
    } catch (error) {
      console.error('Error al guardar archivo:', error);
      this.webDownload(blob, filename);
    }
  }

  private webDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const data = reader.result as string;
        resolve(data.split(',')[1] ?? '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}