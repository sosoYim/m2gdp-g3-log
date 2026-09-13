import { auth } from "./firebase.js";

import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "firebase/auth";

const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const message = document.getElementById("message");

// ENVOI DU LIEN MAGIQUE
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();

  const actionCodeSettings = {
    url: "http://localhost:5173/",
    handleCodeInApp: true
  };

  try {
    await sendSignInLinkToEmail(
      auth,
      email,
      actionCodeSettings
    );

    localStorage.setItem("emailForSignIn", email);

    message.textContent =
      "Lien envoyé ! Consultez votre boîte e-mail.";

    console.log("Lien magique envoyé à :", email);

  } catch (error) {
    console.error("Erreur envoi lien :", error);

    message.textContent =
      "Erreur lors de l'envoi du lien.";
  }
});


// TRAITEMENT DU LIEN LORS DU RETOUR SUR SUBLYON
async function completeEmailSignIn() {

  if (!isSignInWithEmailLink(auth, window.location.href)) {
    return;
  }

  let email = localStorage.getItem("emailForSignIn");

  if (!email) {
    email = window.prompt(
      "Confirmez votre adresse e-mail :"
    );
  }

  if (!email) {
    return;
  }

  try {

    const result = await signInWithEmailLink(
      auth,
      email,
      window.location.href
    );

    localStorage.removeItem("emailForSignIn");

    message.textContent =
      `Connexion réussie : ${result.user.email}`;

    console.log(
      "Utilisateur connecté :",
      result.user
    );

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

  } catch (error) {

    console.error(
      "Erreur de connexion :",
      error
    );

    message.textContent =
      "Impossible de terminer la connexion.";
  }
}

completeEmailSignIn();