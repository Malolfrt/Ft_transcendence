import { state } from "../state";
import { navigateTo } from "../router";
import { translateText } from "../translate";

export default function Home(): HTMLElement {
    if (state.user) {
        navigateTo(new Event("click"), "/matches");
        return document.createElement("div");
    }
    else
        navigateTo(new Event("click"), "/login");

    const container: HTMLDivElement = document.createElement("div");
    container.className = "flex flex-col items-center min-h-screen bg-black text-white p-8";

    const title: HTMLHeadingElement = document.createElement("h1");
    translateText("Bienvenue sur Ft Transcendence").then((translated) => {
        title.innerHTML = "🚀 " + translated;
    })
    title.className = "text-4xl font-bold text-purple-400";

    const loginButton: HTMLButtonElement = document.createElement("button");
    translateText("Se Connecter").then((translated) => {
        loginButton.innerHTML = "🔑 " + translated;
    })
    loginButton.className = "mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-md transition-all";
    loginButton.onclick = (e) => navigateTo(e, "/login");

    container.append(title, loginButton);
    return container;
}
