import { Injectable } from '@angular/core';

import { auth } from '../firebase/firebase';

import { environment } from '../../../environments/environment';


export interface UploadedMedia {

  key: string;

  url: string;

}


/*
 * Taille maximale (px) du plus grand côté
 * après redimensionnement dans le navigateur.
 */
const MAX_DIMENSION = 1920;


@Injectable({
  providedIn: 'root'
})
export class Media {


  /*
   * =========================================
   * UPLOAD D'UNE PHOTO (WORKER → R2)
   * =========================================
   */
  async uploadPhoto(
    file: File
  ): Promise<UploadedMedia> {

    if (!['image/jpeg', 'image/png'].includes(file.type)) {

      throw new Error(
        'Formats acceptés : JPG ou PNG.'
      );

    }


    const body =
      await this.resizeImage(file);


    const response =
      await fetch(
        `${environment.apiUrl}/api/media`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${await this.getIdToken()}`,
            'Content-Type': body.type
          },
          body
        }
      );


    if (!response.ok) {

      const data =
        await response.json().catch(() => ({}));

      throw new Error(
        data.error ?? 'Impossible d\'envoyer la photo.'
      );

    }


    return response.json();

  }


  /*
   * =========================================
   * SUPPRESSION D'UNE PHOTO
   * =========================================
   */
  async deletePhoto(
    key: string
  ): Promise<void> {

    const response =
      await fetch(
        `${environment.apiUrl}/api/media/${encodeURIComponent(key)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${await this.getIdToken()}`
          }
        }
      );


    if (!response.ok && response.status !== 404) {

      throw new Error(
        'Impossible de supprimer la photo.'
      );

    }

  }


  private async getIdToken(): Promise<string> {

    const user =
      auth.currentUser;


    if (!user) {

      throw new Error(
        'Utilisateur non connecté.'
      );

    }


    return user.getIdToken();

  }


  /*
   * =========================================
   * REDIMENSIONNEMENT
   * =========================================
   *
   * Les photos de téléphone dépassent souvent
   * 5 Mo : on les réduit en JPEG avant l'envoi.
   */
  private async resizeImage(
    file: File
  ): Promise<Blob> {

    const bitmap =
      await createImageBitmap(file);


    const scale =
      Math.min(
        1,
        MAX_DIMENSION / Math.max(bitmap.width, bitmap.height)
      );


    if (scale === 1 && file.size < 1.5 * 1024 * 1024) {

      bitmap.close();

      return file;

    }


    const canvas =
      document.createElement('canvas');

    canvas.width =
      Math.round(bitmap.width * scale);

    canvas.height =
      Math.round(bitmap.height * scale);


    canvas
      .getContext('2d')
      ?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    bitmap.close();


    return new Promise((resolve, reject) =>
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Image illisible.')),
        'image/jpeg',
        0.85
      )
    );

  }

}
