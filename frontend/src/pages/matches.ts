import { state } from "../state";
import { navigateTo } from "../router";
import Sidebar from "../components/sidebar";
import { translateText } from "../translate";

export default async function Matches() : Promise<HTMLDivElement> {

    const textsToTranslate: string[] = [
        "Modes de jeu",
        "Local 1v1",
        "Affrontez un ami en local sur le même écran dans un duel épique de Pong !",
        "Jouer maintenant",
        "Local vs IA",
        "Défiez notre IA dans un match de Pong et testez vos compétences !",
        "Jouer contre l'IA",
        "Choisissez la difficulté",
        "Facile",
        "Normal",
        "Difficile",
        "Annuler",
        "Tournoi",
        "Participez à un tournoi épique et prouvez que vous êtes le meilleur joueur de Pong !",
        "Rejoindre un tournoi"
    ];

    const [
        translatedTitle,
        translatedLocal1v1, 
        translatedLocalDesc, 
        translatedPlayNow, 
        translatedLocalAI, 
        translatedAIDesc, 
        translatedPlayAI,
        translatedDifficulty,
        translatedEasy,
        translatedNormal,
        translatedHard,
        transletedCancel,
        translatedTournament,
        translatedTournamentDesc,
        translatedPlayTournament
    ] = await Promise.all(textsToTranslate.map(text => translateText(text)));

    if (!state.user) {
        setTimeout(() => {
            if (!state.user) {
                navigateTo(new Event("click"), "/login");
            }
        }, 200);
        return document.createElement("div");
    }

    const container: HTMLDivElement = document.createElement("div");
    container.className = "flex flex-col items-center min-h-screen bg-black text-white relative overflow-hidden";
    
    container.innerHTML = `
    <div class="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black"></div>
    <div class="absolute inset-0 bg-stars animate-twinkling"></div>
    `;

    if (state.user) {
        Sidebar().then(container => {
            document.body.appendChild(container);
        })
    }

    const mainSection: HTMLDivElement = document.createElement("div");
    mainSection.className = "relative z-10 flex w-full h-screen pl-[250px]";

    const gameSection: HTMLDivElement = document.createElement("div");
    gameSection.className = "flex-1 p-8 overflow-y-auto custom-scrollbar";

    const gameSectionTitle: HTMLHeadingElement = document.createElement("h2");
    gameSectionTitle.className = "text-4xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text mb-12";
    gameSectionTitle.innerHTML = "🎮 " + `<span class="text-transparent">${translatedTitle}</span>`;

    const gameCardsContainer: HTMLDivElement = document.createElement("div");
    gameCardsContainer.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto";

    // Mode Local 1v1
    const localGameCard: HTMLDivElement = document.createElement("div");
    localGameCard.className = "game-card bg-gray-800/50 p-8 rounded-xl shadow-lg backdrop-blur-sm border border-blue-500/20 hover:border-blue-500/50 transition-all transform hover:scale-105 group";
    
    localGameCard.innerHTML = `
        <div class="flex flex-col h-full text-center">
            <h3 class="text-3xl font-semibold text-blue-300 mb-6 group-hover:text-blue-200 transition-colors">
                <span class="game-icon">🎮</span> ${translatedLocal1v1}
            </h3>
            <p class="text-gray-300 mb-8 text-lg game-card-text">${translatedLocalDesc}</p>
            <button class="game-button w-full bg-blue-600 hover:bg-blue-500 text-white text-xl font-semibold py-6 px-8 rounded-lg transition-all transform hover:scale-105 hover:shadow-xl">
                ${translatedPlayNow}
            </button>
        </div>
    `;

    // Mode Local vs IA
    const localAICard: HTMLDivElement = document.createElement("div");
    localAICard.className = "game-card bg-gray-800/50 p-8 rounded-xl shadow-lg backdrop-blur-sm border border-green-500/20 hover:border-green-500/50 transition-all transform hover:scale-105 group";
    localAICard.setAttribute("data-mode", "ai");
    
    localAICard.innerHTML = `
        <div class="flex flex-col h-full text-center">
            <h3 class="text-3xl font-semibold text-green-300 mb-6 group-hover:text-green-200 transition-colors">
                <span class="game-icon">🤖</span> ${translatedLocalAI}
            </h3>
            <p class="text-gray-300 mb-8 text-lg game-card-text">${translatedAIDesc}</p>
            <button class="game-button w-full bg-green-600 hover:bg-green-500 text-white text-xl font-semibold py-6 px-8 rounded-lg transition-all transform hover:scale-105 hover:shadow-xl">
                ${translatedPlayAI}
            </button>
        </div>
    `;

    // Menu de sélection de difficulté
    const difficultyMenu: HTMLDivElement = document.createElement("div") as HTMLDivElement;
    difficultyMenu.className = "fixed inset-0 bg-black/80 backdrop-blur-sm z-50 hidden";
    difficultyMenu.innerHTML = `
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800/90 p-8 rounded-xl border border-green-500/30 shadow-2xl w-96">
            <h3 class="text-2xl font-bold text-green-300 mb-6 text-center">${translatedDifficulty}</h3>
            <div class="space-y-4">
                <button class="difficulty-btn w-full bg-green-600 hover:bg-green-500 text-white text-lg font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 hover:shadow-xl" data-difficulty="easy">
                    <span class="mr-2">🌱</span> ${translatedEasy}
                </button>
                <button class="difficulty-btn w-full bg-yellow-600 hover:bg-yellow-500 text-white text-lg font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 hover:shadow-xl" data-difficulty="normal">
                    <span class="mr-2">⚡</span> ${translatedNormal}
                </button>
                <button class="difficulty-btn w-full bg-red-600 hover:bg-red-500 text-white text-lg font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 hover:shadow-xl" data-difficulty="hard">
                    <span class="mr-2">🔥</span> ${translatedHard}
                </button>
            </div>
            <button class="close-menu mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white text-lg font-semibold py-3 px-6 rounded-lg transition-all">
                ${transletedCancel}
            </button>
        </div>
    `;



    document.body.appendChild(difficultyMenu);

    // Mode Tournoi
    const tournamentCard: HTMLDivElement = document.createElement("div");
    tournamentCard.className = "game-card bg-gray-800/50 p-8 rounded-xl shadow-lg backdrop-blur-sm border border-purple-500/20 hover:border-purple-500/50 transition-all transform hover:scale-105 group";
    
    tournamentCard.innerHTML = `
        <div class="flex flex-col h-full text-center">
            <h3 class="text-3xl font-semibold text-purple-300 mb-6 group-hover:text-purple-200 transition-colors">
                <span class="game-icon">🏆</span> ${translatedTournament}
            </h3>
            <p class="text-gray-300 mb-8 text-lg game-card-text">${translatedTournamentDesc}</p>
            <button class="game-button w-full bg-purple-600 hover:bg-purple-500 text-white text-xl font-semibold py-6 px-8 rounded-lg transition-all transform hover:scale-105 hover:shadow-xl">
                ${translatedPlayTournament}
            </button>
        </div>
    `;

    gameCardsContainer.append(localGameCard, localAICard, tournamentCard);
    gameSection.append(gameSectionTitle, gameCardsContainer);
    mainSection.appendChild(gameSection);
    container.appendChild(mainSection);

    const localPlayButton = localGameCard.querySelector('button');
    if (localPlayButton) {
        localPlayButton.onclick = (e) => navigateTo(e, "/local-match");
    }

    const localAIButton = localAICard.querySelector('button');
    if (localAIButton) {
        localAIButton.onclick = () => {
            difficultyMenu.classList.remove('hidden');
            difficultyMenu.classList.add('fade-in');
        };
    }

    const tournamentButton = tournamentCard.querySelector('button');
    if (tournamentButton) {
        tournamentButton.onclick = (e) => navigateTo(e, "/tournament");
    }

    const closeMenuButton: HTMLButtonElement = difficultyMenu.querySelector('.close-menu') as HTMLButtonElement;
    if (closeMenuButton) {
        closeMenuButton.onclick = () => {
            difficultyMenu.classList.add('fade-out');
            setTimeout(() => {
                difficultyMenu.classList.add('hidden');
                difficultyMenu.classList.remove('fade-out');
            }, 300);
        };
    }

    const difficultyButtons = difficultyMenu.querySelectorAll('.difficulty-btn');
    difficultyButtons.forEach(button => {
        (button as HTMLButtonElement).onclick = (e: Event) => {
            const difficulty = (e.currentTarget as HTMLElement).dataset.difficulty;
            difficultyMenu.classList.add('fade-out');
            setTimeout(() => {
                difficultyMenu.classList.add('hidden');
                difficultyMenu.classList.remove('fade-out');
                navigateTo(e, `/game-ai?difficulty=${difficulty}`);
            }, 300);
        };
    });

    difficultyMenu.onclick = (e: MouseEvent) => {
        if (e.target === difficultyMenu) {
            difficultyMenu.classList.add('fade-out');
            setTimeout(() => {
                difficultyMenu.classList.add('hidden');
                difficultyMenu.classList.remove('fade-out');
            }, 300);
        }
    };

    return container;
}
