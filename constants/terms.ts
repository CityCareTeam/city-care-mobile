import type { Language } from "@/constants/i18n";
import type { PrivacySection } from "@/constants/privacy";

/**
 * Conditions d'utilisation.
 *
 * Elles existent d'abord parce qu'on ne peut pas modérer ce qu'on n'a pas
 * interdit : retirer un contenu sans règle écrite est arbitraire, et le laisser
 * faute de règle est pire. Le texte ci-dessous est donc court et concret — ce
 * qu'on peut publier, ce qui sera retiré, ce qu'on garde le droit de faire.
 *
 * Deux clauses ne sont pas là par formalisme. Celle sur les photos : sans une
 * autorisation d'affichage, la collectivité n'a pas le droit de montrer l'image
 * qu'on lui envoie. Celle sur les données d'autrui : c'est la seule qui protège
 * les passants qu'un signalement photographie sans les avoir prévenus.
 *
 * ⚠️ Les `[À COMPLÉTER]` sont les mentions que le code ne peut pas connaître.
 */
const FR: PrivacySection[] = [
  {
    title: "Ce que fait ce service",
    body: [
      "CityCare+ permet de signaler un problème dans l’espace public, de suivre son traitement et d’échanger avec les agents qui s’en occupent. Il est édité par [À COMPLÉTER : nom de l’éditeur].",
      "Le service est fourni tel quel, sans garantie de délai de traitement : signaler n’oblige personne à intervenir, et l’application ne remplace jamais un appel aux secours.",
    ],
  },
  {
    title: "Votre compte",
    body: [
      "Vous vous engagez à donner des informations exactes et à garder votre mot de passe pour vous. Un compte est personnel.",
      "Vous pouvez le supprimer à tout moment depuis l’écran Profil. Nous pouvons le suspendre en cas de manquement grave ou répété aux règles ci-dessous.",
    ],
  },
  {
    title: "Ce que vous publiez",
    body: [
      "Signalez des problèmes réels, à l’endroit où ils se trouvent. Un signalement inventé, un doublon volontaire ou un test occupent le temps de quelqu’un.",
      "Sont interdits : les propos injurieux, haineux ou menaçants ; la mise en cause nominative d’une personne ; les données personnelles d’autrui — nom, plaque, visage identifiable, adresse de quelqu’un d’autre ; la publicité ; et tout ce qui est hors sujet.",
      "Cadrez vos photos sur le problème. Les personnes qui passent n’ont pas demandé à figurer sur une carte publique.",
    ],
  },
  {
    title: "Vos photos",
    body: [
      "Vous restez propriétaire des photos que vous envoyez. En les joignant, vous autorisez l’éditeur et la collectivité concernée à les afficher dans l’application et à s’en servir pour traiter votre signalement — rien d’autre.",
      "Vous confirmez avoir le droit de les publier : ce sont vos images, et elles ne portent pas atteinte à la vie privée d’un tiers.",
    ],
  },
  {
    title: "Modération",
    body: [
      "Un contenu contraire à ces règles peut être retiré, et son auteur averti puis suspendu. Un signalement retiré n’est pas perdu pour vous : vous pouvez le corriger et le renvoyer.",
      "Pour nous signaler un contenu problématique, écrivez à [À COMPLÉTER : adresse de contact].",
    ],
  },
  {
    title: "Droit applicable",
    body: [
      "Ces conditions sont soumises au droit [À COMPLÉTER : droit applicable, juridiction compétente]. Elles peuvent évoluer ; la date de révision figure en tête, et une modification importante vous sera annoncée dans l’application.",
    ],
  },
];

const EN: PrivacySection[] = [
  {
    title: "What this service does",
    body: [
      "CityCare+ lets you report a problem in public space, follow how it is handled, and talk with the officers dealing with it. It is published by [TO BE COMPLETED: publisher name].",
      "The service is provided as is, with no guaranteed handling time: reporting does not oblige anyone to intervene, and the app never replaces an emergency call.",
    ],
  },
  {
    title: "Your account",
    body: [
      "You agree to give accurate details and to keep your password to yourself. An account is personal.",
      "You may delete it at any time from the Profile screen. We may suspend it in case of serious or repeated breaches of the rules below.",
    ],
  },
  {
    title: "What you post",
    body: [
      "Report real problems, where they are. An invented report, a deliberate duplicate or a test takes up someone’s time.",
      "Not allowed: insulting, hateful or threatening language; naming and blaming an individual; other people’s personal data — names, number plates, identifiable faces, someone else’s address; advertising; and anything off topic.",
      "Frame your photos on the problem. Passers-by did not ask to appear on a public map.",
    ],
  },
  {
    title: "Your photos",
    body: [
      "You keep ownership of the photos you send. By attaching them, you allow the publisher and the relevant authority to display them in the app and use them to handle your report — nothing else.",
      "You confirm you have the right to publish them: they are your images, and they do not intrude on anyone’s privacy.",
    ],
  },
  {
    title: "Moderation",
    body: [
      "Content breaking these rules may be removed, and its author warned then suspended. A removed report is not lost to you: you can correct it and send it again.",
      "To report problematic content to us, write to [TO BE COMPLETED: contact address].",
    ],
  },
  {
    title: "Governing law",
    body: [
      "These terms are governed by [TO BE COMPLETED: governing law, competent court]. They may change; the revision date is shown at the top, and any significant change will be announced in the app.",
    ],
  },
];

export function termsSections(language: Language): PrivacySection[] {
  return language === "en" ? EN : FR;
}

/** À changer en même temps que le texte, jamais séparément. */
export const TERMS_UPDATED = "2026-08-17";
