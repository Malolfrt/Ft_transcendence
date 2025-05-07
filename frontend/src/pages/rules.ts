import { translateText } from "../translate";
import { state } from "../state";
import Sidebar from "../components/sidebar"

export default async function Rules()
{
    /*          TRANSLATE TAB       */
    const textToTranslate: string[] = [
        "Règles du Jeu Pong",
        "Pong est un jeu de tennis de table en 2D où deux joueurs contrôlent une raquette de chaque côté de l'écran.",
        "Chaque joueur peut déplacer sa raquette verticalement.",
        "Le but est de renvoyer la balle et de marquer un point si l'adversaire ne la rattrape pas.",
        "Le premier joueur atteignant le score fixé remporte la partie.",
        "Modules du Projet Transcendence",
        "Sécurité",
        "Authentification 2FA et JWT",
        "Options GDPR : anonymisation, gestion locale des données, suppression de compte",
        "Backend",
        "Utilisation d'un framework Node.js",
        "Base de données pour le backend",
        "Frontend & UX",
        "Utilisation de Tailwind CSS et TypeScript",
        "Compatibilité avec plusieurs navigateurs web",
        "Support multilingue",
        "Intelligence Artificielle",
        "Ajout d'un adversaire IA",
        "Total : 7 points (Modules majeurs : 3 | Modules mineurs : 8)"
    ];
    const [
        translatedTitleRules,
        translatedPRules,
        translatedliRules1,
        translatedliRules2,
        translatedliRules3,
        translatedTitleModules,
        translatedSecurity,
        translated2FA,
        translatedRGPD,
        translatedBackend,
        translatedNode,
        translatedDB,
        translatedFrontend,
        translatedtailwind,
        translatedCompatibility,
        translatedTranslate,
        translatedIA,
        translatedIAadverse,
        translatedFooter
    ] = await Promise.all(textToTranslate.map(text => translateText(text)));
    
    if (state.user) {
            Sidebar().then(container => {
                document.body.appendChild(container);
            })
        }
    const mainDiv: HTMLDivElement = document.createElement("div");
    mainDiv.className = "mx-auto flex-col ml-5 mr-5 overflow-auto  justify-items-center p-6 relative z-10 flex w-full h-screen pl-[250px]";
    const titleRules: HTMLHeadElement = document.createElement("h1");
    titleRules.className = "text-2xl font-bold text-center mt-10 mb-6";
    titleRules.innerHTML = "🎮 " + translatedTitleRules;

    const rulesDiv: HTMLHeadElement = document.createElement("h2");
    rulesDiv.innerHTML = `<div class="bg-gray-800 p-6 rounded-lg shadow-lg">
            <p>${translatedPRules}</p>
            <ul class="list-disc list-inside mt-4">
                <li>${translatedliRules1}</li>
                <li>${translatedliRules2}</li>
                <li>${translatedliRules3}</li>
            </ul>
        </div>`;

    const titleModules: HTMLHeadElement = document.createElement("h2");
    titleModules.className = "text-2xl font-bold text-center mt-10 mb-6";
    titleModules.innerHTML = "🛠 " + translatedTitleModules;
    mainDiv.appendChild(titleModules);

    const modulesDiv: HTMLDivElement = document.createElement("div");
    modulesDiv.className = "grid grid-cols-1 md:grid-cols-2 gap-6";

    const divSecurity: HTMLDivElement = document.createElement("div");
    divSecurity.innerHTML = `<div class="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 class="text-xl font-bold">🔒 ${translatedSecurity}</h3>
                <ul class="list-disc list-inside mt-2">
                    <li>${translated2FA}</li>
                    <li>${translatedRGPD}</li>
                </ul>
            </div>`;
    modulesDiv.appendChild(divSecurity);

    const divBackend: HTMLDivElement = document.createElement("div");
    divBackend.innerHTML = `<div class="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 class="text-xl font-bold">⚙️ ${translatedBackend}</h3>
                <ul class="list-disc list-inside mt-2">
                    <li>${translatedNode}</li>
                    <li>${translatedDB}</li>
                </ul>
            </div>`;
    modulesDiv.appendChild(divBackend);

    const divFrontend: HTMLDivElement = document.createElement("div");
    divFrontend.innerHTML = `<div class="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 class="text-xl font-bold">🎨 ${translatedFrontend}</h3>
                <ul class="list-disc list-inside mt-2">
                    <li>${translatedtailwind}</li>
                    <li>${translatedCompatibility}</li>
                    <li>${translatedTranslate}</li>
                </ul>
            </div>`;
    modulesDiv.appendChild(divFrontend);

    const divIA: HTMLDivElement = document.createElement("div");
    divIA.innerHTML = `<div class="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 class="text-xl font-bold">🧠 ${translatedIA}</h3>
                <ul class="list-disc list-inside mt-2">
                    <li>${translatedIAadverse}</li>
                </ul>
            </div>`
    modulesDiv.appendChild(divIA);

    const footer: HTMLParagraphElement = document.createElement("p");
    footer.className = "mt-10 text-gray-400 w-100 text-center";
    footer.innerHTML = translatedFooter;


    mainDiv.append(titleRules, rulesDiv, titleModules, modulesDiv, footer);

    return mainDiv;
}