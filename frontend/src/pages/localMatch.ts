import { state } from "../state";
import { navigateTo } from "../router";
import { loginWithoutSession } from "../services/auth";
import { getUsers } from "../services/userService";
import { translateText } from "../translate";

export default async function LocalMatch(): Promise<HTMLElement> {
     const textToTranslate = [
        "Match Local 1v1",
        "Match à durée limitée",
        "Match en nombre de points",
        "points",
        "Veuillez entrer le mot de passe du Joueur 2.",
        "Échec de l'authentification. Vérifiez le mot de passe.",
        "Sélectionner votre adversaire",
        "Mot de passe de l'adversaire",
        "Connecter l'adversaire",
        "Durée du match",
        "Nombre de points à atteindre",
        "Commencer la partie",
        "Entrez le mot de passe...",
        "min"

    ];
    const [
        translatedMatch1v1,
        translatedMatchTime,
        translatedMatchPoint,
        translatedPoint,
        translatedAlertEnterPwd,
        translatedAlertFailed,
        translatedChooseAgainst,
        translatedPwdAgainst,
        translatedConnectAgainst,
        translatedTimingMatch,
        translatedNumberOfPoints,
        translatedStartParty,
        translatedEnterPwd,
        translatedMinute

    ] = await Promise.all(textToTranslate.map(text => translateText(text)));

    if (!state.user) {
        navigateTo(new Event("click"), "/login");
        return document.createElement("div");
    }

    localStorage.setItem('currentPage', 'local-match');

    const users = await getUsers();

    const container = document.createElement("div");
    container.className = "flex flex-col items-center min-h-screen bg-gradient-to-r from-blue-950 via-blue-700 to-blue-950 text-white p-8 space-y-6";

    const title = document.createElement("h1");
    title.innerHTML = `🏓 ${translatedMatch1v1}`;
    title.className = "text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-100 text-center";

    const mainSection = document.createElement("div");
    mainSection.className = "w-full max-w-xl bg-black bg-opacity-40 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-blue-500/30 flex flex-col items-center space-y-6";

    const playerSelectionContainer = document.createElement("div");
    playerSelectionContainer.className = "w-full space-y-3";
    
    const playerSelectLabel = document.createElement("div");
    playerSelectLabel.className = "text-xl font-medium text-blue-200";
    playerSelectLabel.innerHTML = translatedChooseAgainst;
    
    const player2Select = document.createElement("select");
    player2Select.className = "w-full px-4 py-3 rounded-lg text-white shadow-md border-2 border-blue-600 bg-blue-900/70 focus:border-blue-400 focus:ring focus:ring-blue-400/50 transition-all";

    users.forEach(user => {
        if (user.username !== state.user.username) {
            const option: HTMLOptionElement = document.createElement("option");
            option.value = user.username;
            option.innerHTML = user.username;
            player2Select.appendChild(option);
        }
    });

    playerSelectionContainer.append(playerSelectLabel, player2Select);

    const passwordContainer = document.createElement("div");
    passwordContainer.className = "w-full space-y-3 hidden";
    
    const passwordLabel = document.createElement("div");
    passwordLabel.className = "text-xl font-medium text-blue-200";
    passwordLabel.innerHTML = translatedPwdAgainst;
    
    const player2Password = document.createElement("input");
    player2Password.type = "password";
    player2Password.placeholder = translatedEnterPwd;
    player2Password.className = "w-full px-4 py-3 rounded-lg text-white shadow-md border-2 border-blue-600 bg-blue-900/70 focus:border-blue-400 focus:ring focus:ring-blue-400/50 transition-all placeholder-blue-300/70";

    passwordContainer.append(passwordLabel, player2Password);

    const connectButton = document.createElement("button");
    connectButton.innerHTML = `🔑 ${translatedConnectAgainst}`;
    connectButton.className = "w-full px-6 py-3 bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white rounded-lg shadow-lg transition-all transform hover:scale-105 font-bold text-lg hidden";

    const matchSettingsContainer = document.createElement("div");
    matchSettingsContainer.className = "w-full space-y-6 hidden";

    const pointsContainer = document.createElement("div");
    pointsContainer.className = "w-full space-y-3";
    
    const pointsLabel = document.createElement("div");
    pointsLabel.className = "text-xl font-medium text-blue-200";
    pointsLabel.innerHTML = translatedNumberOfPoints;

    const pointsOptions = document.createElement("select");
    pointsOptions.className = "w-full px-4 py-3 rounded-lg text-white shadow-md border-2 border-blue-600 bg-blue-900/70 focus:border-blue-400 focus:ring focus:ring-blue-400/50 transition-all";

    [5, 10, 15].forEach(points => {
        const option: HTMLOptionElement = document.createElement("option");
        option.value = String(points);
        option.innerHTML = `🎯 ${points} ${translatedPoint}`;
        pointsOptions.appendChild(option);
    });
    
    pointsContainer.append(pointsLabel, pointsOptions);

    const startGameButton = document.createElement("button");
    startGameButton.innerHTML = `🚀 ${translatedStartParty}`;

    startGameButton.className = "w-full px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white rounded-lg shadow-lg transition-all transform hover:scale-105 font-bold text-xl";

    function showLoginFields() {
        passwordContainer.classList.remove("hidden");
        connectButton.classList.remove("hidden");
    }

    player2Select.addEventListener("change", showLoginFields);
    if (player2Select.value) {
        showLoginFields();
    }

    connectButton.onclick = async () => {
        const player2Username: string = player2Select.value;
        const password: string = player2Password.value.trim();

        if (!password) {
            alert( translatedAlertEnterPwd);
            return;
        }

        try {
            const player2Auth = await loginWithoutSession(player2Username, password);

            if (!state.localMatch) {
                state.localMatch = {
                    player1: state.user.username,
                    player2: "",
                    player2Auth: null,
                    mode: "points",
                    target: 10
                };
            }
            state.localMatch.player2Auth = player2Auth;

            playerSelectionContainer.classList.add("hidden");
            passwordContainer.classList.add("hidden");
            connectButton.classList.add("hidden");

            matchSettingsContainer.classList.remove("hidden");
        } catch (error) {
            alert(translatedAlertFailed);
        }
    };

    startGameButton.onclick = () => {
        if (!state.localMatch) {
            return;
        }
    
        state.localMatch.player1 = state.user.username;
        state.localMatch.player2 = player2Select.value;
        state.localMatch.mode = "points";
        state.localMatch.target = parseInt(pointsOptions.value);
    
        navigateTo(new Event("click"), "/game-local");
    };

    matchSettingsContainer.append(pointsContainer, startGameButton);
    mainSection.append(playerSelectionContainer, passwordContainer, connectButton, matchSettingsContainer);
    container.append(title, mainSection);
    
    return container;
}
