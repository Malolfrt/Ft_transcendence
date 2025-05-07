import { state } from "../state";
import { navigateTo } from "../router";
import { getUsers } from "../services/userService";
import { loginWithoutSession } from "../services/auth";
import { translateText } from "../translate";

export default async function TournamentSettings(): Promise<HTMLElement> {
    
    const textToTranslate: string[] = [
        "Paramètres du Tournoi",
        "Nombre de joueurs :",
        "joueurs",
        "Suivant",
        "Se connecter",
        "connecté",
        "points",
        "Lancer le tournoi",
        "Connexion échouée !",
        "Remplissez les champs !",
        "Ce joueur est déjà connecté !",
        "Hôte du tournoi",
        "Option de jeu",
        "Objectif"
    ];
    const [
        translatedParam,
        translatedNb,
        translatedPlayer,
        translatedNext,
        translatedConnexion,
        translatedConnected,
        translatedPoint,
        translatedStartTournament,
        translatedFailedConnexion,
        translatedAlertFillUpForm,
        translatedAlertUserConnected,
        translatedHoteTournament,
        translatedGameOption,
        translatedObjectif
    ] = await Promise.all(textToTranslate.map(text => translateText(text)));
    
    if (!state.user) {
        navigateTo(new Event("click"), "/login");
        return document.createElement("div");
    }
    
    localStorage.setItem('currentPage', 'tournament-settings');

    const users = await getUsers();

    const container = document.createElement("div");
    container.className = "flex flex-col items-center min-h-screen bg-gradient-to-r from-indigo-950 via-purple-900 to-indigo-950 text-white p-8 space-y-8";

    const header = document.createElement("div");
    header.className = "w-full max-w-3xl bg-black bg-opacity-40 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-purple-500/30 mb-8";
    
    const title = document.createElement("h1");
    title.innerText = `🏆 ${translatedParam}`;
    title.className = "text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 text-center";
    
    header.appendChild(title);

    const step1 = document.createElement("div");
    step1.className = "w-full max-w-2xl bg-black bg-opacity-30 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-indigo-500/30 space-y-6";

    const playersCountLabel = document.createElement("p");
    playersCountLabel.innerText = `👥 ${translatedNb}`;
    playersCountLabel.className = "text-xl font-medium text-purple-200";

    const playersCountSelect = document.createElement("select");
    playersCountSelect.className = "w-full px-4 py-3 rounded-xl text-white bg-indigo-900/70 border-2 border-indigo-600 shadow-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all";
    [4, 8, 16].forEach(count => {
        const option: HTMLOptionElement = document.createElement("option");
        option.value = String(count);
        option.innerHTML = `${count} ` + translatedPlayer;
        playersCountSelect.appendChild(option);
    });

    const nextStepButton1 = document.createElement("button");
    nextStepButton1.innerText = translatedNext;
    nextStepButton1.className = "w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-xl shadow-lg transition-all font-medium flex items-center justify-center space-x-2";
    
    const arrowIcon = document.createElement("span");
    arrowIcon.innerHTML = "→";
    arrowIcon.className = "ml-2";
    nextStepButton1.appendChild(arrowIcon);

    step1.append(playersCountLabel, playersCountSelect, nextStepButton1);

    const step2 = document.createElement("div");
    step2.className = "w-full max-w-2xl bg-black bg-opacity-30 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-indigo-500/30 space-y-6 hidden";

    const playersListContainer = document.createElement("div");
    playersListContainer.className = "space-y-6 max-h-[60vh] overflow-y-auto pr-2";
    // Styles personnalisés pour la barre de défilement
    playersListContainer.style.scrollbarWidth = "thin";
    playersListContainer.style.scrollbarColor = "rgba(139, 92, 246, 0.5) rgba(30, 27, 75, 0.3)"; // Couleurs violet/indigo pour la barre de défilement
    
    // Styles spécifiques pour webkit (Chrome, Safari, etc.)
    const scrollbarStyles = document.createElement("style");
    scrollbarStyles.textContent = `
        .players-scroll::-webkit-scrollbar {
            width: 8px;
        }
        .players-scroll::-webkit-scrollbar-track {
            background: rgba(30, 27, 75, 0.3);
            border-radius: 10px;
        }
        .players-scroll::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.5);
            border-radius: 10px;
        }
        .players-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(139, 92, 246, 0.7);
        }
    `;
    document.head.appendChild(scrollbarStyles);
    playersListContainer.classList.add("players-scroll");

    let connectedPlayers = new Set<string>();
    connectedPlayers.add(state.user.username);

    const hostPlayerCard = document.createElement("div");
    hostPlayerCard.className = "bg-gradient-to-r from-green-900/40 to-emerald-900/40 p-4 rounded-xl border border-green-500/40";
    
    const hostPlayerLabel = document.createElement("div");
    hostPlayerLabel.className = "text-green-300 font-medium mb-2";
    hostPlayerLabel.innerText = translatedHoteTournament;
    
    const hostPlayerName = document.createElement("div");
    hostPlayerName.className = "text-white font-bold text-lg flex items-center";
    hostPlayerName.innerText = `${state.user.username} `;
    
    const checkIcon = document.createElement("span");
    checkIcon.innerText = "✓";
    checkIcon.className = "ml-2 bg-green-500 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs";
    hostPlayerName.appendChild(checkIcon);
    
    hostPlayerCard.append(hostPlayerLabel, hostPlayerName);
    playersListContainer.appendChild(hostPlayerCard);

    function generatePlayerInputs() {
        // Conserver la carte du joueur hôte
        const hostCard = playersListContainer.firstChild;
        playersListContainer.innerHTML = "";
        playersListContainer.appendChild(hostCard as Node);
        
        const numPlayers = parseInt(playersCountSelect.value) - 1;

        for (let i = 0; i < numPlayers; i++) {
            const playerContainer = document.createElement("div");
            playerContainer.className = "bg-indigo-900/30 p-4 rounded-xl border border-indigo-500/30 space-y-3";

            const playerLabel = document.createElement("div");
            playerLabel.className = "text-indigo-300 font-medium";
            playerLabel.innerText = `${translatedPlayer} ${i + 2}`;
            playerContainer.appendChild(playerLabel);

            const inputGroup = document.createElement("div");
            inputGroup.className = "grid grid-cols-1 sm:grid-cols-2 gap-3";

            const usernameInput: HTMLInputElement = document.createElement("input");
            usernameInput.type = "text";
            usernameInput.placeholder = "Pseudo";
            usernameInput.className = "px-4 py-2 rounded-lg text-white bg-black/50 border border-indigo-600/50 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400";

            const passwordInput: HTMLInputElement = document.createElement("input");
            passwordInput.type = "password";
            passwordInput.placeholder = "Mot de passe";
            passwordInput.className = "px-4 py-2 rounded-lg text-white bg-black/50 border border-indigo-600/50 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400";

            inputGroup.append(usernameInput, passwordInput);
            playerContainer.appendChild(inputGroup);

            const loginButton = document.createElement("button");
            loginButton.innerText = translatedConnexion;
            loginButton.className = "w-full px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg shadow transition-colors flex items-center justify-center";
            
            const keyIcon = document.createElement("span");
            keyIcon.innerText = "🔑";
            keyIcon.className = "mr-2";
            loginButton.prepend(keyIcon);
            
            loginButton.onclick = async () => {
                const username: string = usernameInput.value.trim();
                const password: string = passwordInput.value.trim();

                if (!username || !password) {
                    alert(translatedAlertFillUpForm);
                    return;
                }

                if (connectedPlayers.has(username)) {
                    alert(translatedAlertUserConnected);
                    return;
                }

                try {
                    await loginWithoutSession(username, password);
                    loginButton.innerHTML = "";
                    const checkmarkIcon = document.createElement("span");
                    checkmarkIcon.innerText = "✓";
                    loginButton.appendChild(checkmarkIcon);
                    loginButton.innerHTML += ` ${username} ${translatedConnected}`;
                    loginButton.disabled = true;
                    loginButton.className = "w-full px-4 py-2 bg-green-700 text-white rounded-lg shadow flex items-center justify-center";
                    usernameInput.disabled = true;
                    passwordInput.disabled = true;
                    connectedPlayers.add(username);
                    updateNextStepButtonVisibility();
                } catch (error) {
                    alert(translatedFailedConnexion);
                }
            };

            playerContainer.appendChild(loginButton);
            playersListContainer.appendChild(playerContainer);
        }
    }

    playersCountSelect.addEventListener("change", generatePlayerInputs);
    generatePlayerInputs();

    const nextStepButton2 = document.createElement("button");
    nextStepButton2.innerText = translatedNext;
    nextStepButton2.className = "w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-xl shadow-lg transition-all font-medium flex items-center justify-center space-x-2 hidden";
    
    const arrowIcon2 = document.createElement("span");
    arrowIcon2.innerHTML = "→";
    arrowIcon2.className = "ml-2";
    nextStepButton2.appendChild(arrowIcon2);

    function updateNextStepButtonVisibility() {
        if (connectedPlayers.size === parseInt(playersCountSelect.value)) {
            nextStepButton2.classList.remove("hidden");
        }
    }

    step2.append(playersListContainer, nextStepButton2);

    nextStepButton1.onclick = () => {
        step1.classList.add("hidden");
        step2.classList.remove("hidden");
        generatePlayerInputs();
    };

    // Paramètres du tournoi
    const step3 = document.createElement("div");
    step3.className = "w-full max-w-2xl bg-black bg-opacity-30 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-indigo-500/30 space-y-6 hidden";

    const optionsTitle = document.createElement("h2");
    optionsTitle.innerText = translatedGameOption;
    optionsTitle.className = "text-2xl font-bold text-purple-200 mb-4";
    step3.appendChild(optionsTitle);

    const targetContainer = document.createElement("div");
    targetContainer.className = "space-y-2 mt-4";
    
    const targetLabel = document.createElement("label");
    targetLabel.innerText = translatedObjectif;
    targetLabel.className = "text-lg font-medium text-purple-200";
    
    const targetSelect = document.createElement("select");
    targetSelect.className = "w-full px-4 py-3 rounded-xl text-white bg-indigo-900/70 border-2 border-indigo-600 shadow-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all";

    // Points options
    const options: number[] = [5, 10, 15];
    options.forEach(value => {
        const option: HTMLOptionElement = document.createElement("option");
        option.value = String(value);
        option.innerHTML = `${value} ${translatedPoint}`;
        targetSelect.appendChild(option);
    });
    
    targetContainer.append(targetLabel, targetSelect);
    step3.appendChild(targetContainer);

    const startTournamentButton = document.createElement("button");
    startTournamentButton.className = "w-full mt-8 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white rounded-xl shadow-xl transition-all font-medium text-lg flex items-center justify-center";
    
    const rocketIcon = document.createElement("span");
    rocketIcon.innerText = "🚀";
    rocketIcon.className = "mr-2";
    startTournamentButton.appendChild(rocketIcon);
    
    const buttonText = document.createElement("span");
    buttonText.innerText = translatedStartTournament;
    startTournamentButton.appendChild(buttonText);
    
    startTournamentButton.onclick = () => {
        state.tournament = {
            players: Array.from(connectedPlayers),
            matchs: Array.from(connectedPlayers).length - 1,
            mode: "points",
            target: parseInt(targetSelect.value),
            bracket: [],
        };
        localStorage.setItem('tournamentData', JSON.stringify(state.tournament));
        navigateTo(new Event("click"), "/tournament-bracket");
    };

    step3.appendChild(startTournamentButton);
    nextStepButton2.onclick = () => {
        step2.classList.add("hidden");
        step3.classList.remove("hidden");
    };
    const stepsIndicator = document.createElement("div");
    stepsIndicator.className = "flex justify-center space-x-2 my-4";
    
    const step1Dot = document.createElement("div");
    step1Dot.className = "w-3 h-3 rounded-full bg-purple-400";
    
    const step2Dot = document.createElement("div");
    step2Dot.className = "w-3 h-3 rounded-full bg-purple-200/40";
    
    const step3Dot = document.createElement("div");
    step3Dot.className = "w-3 h-3 rounded-full bg-purple-200/40";
    
    stepsIndicator.append(step1Dot, step2Dot, step3Dot);
    
    nextStepButton1.onclick = () => {
        step1.classList.add("hidden");
        step2.classList.remove("hidden");
        step1Dot.className = "w-3 h-3 rounded-full bg-purple-200/40";
        step2Dot.className = "w-3 h-3 rounded-full bg-purple-400";
        generatePlayerInputs();
    };
    
    nextStepButton2.onclick = () => {
        step2.classList.add("hidden");
        step3.classList.remove("hidden");
        step2Dot.className = "w-3 h-3 rounded-full bg-purple-200/40";
        step3Dot.className = "w-3 h-3 rounded-full bg-purple-400";
    };

    container.append(header, stepsIndicator, step1, step2, step3);
    return container;
}
