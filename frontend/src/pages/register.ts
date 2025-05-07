import { register, login } from "../services/auth";
import { navigateTo } from "../router";
import { translateText } from "../translate";

export default async function Register() {
    const textsToTranslate: string[] = [
        "Inscription",
        "Nom d'utilisateur",
        "Email",
        "Mot de passe",
        "Confirmer mot de passe",
        "S'inscrire",
        "Déjà inscrit?",
        "Erreur"
    ];

    const [
        translatedRegister,
        translatedUsernameInput, 
        translatedEmailInput, 
        translatedPwdInput, 
        translatedConfirmPwdInput, 
        translatedBtnRegister, 
        translatedAlreadyRegistered,
        translatedErrorOnly
    ] = await Promise.all(textsToTranslate.map(text => translateText(text)));

    if (localStorage.getItem("user"))
        window.location.href = "/matches";
    const form: HTMLFormElement = document.createElement("form");
    form.className = "flex flex-col items-center p-6 bg-gray-900 text-white rounded-xl shadow-lg w-96 mx-auto mt-20 border border-gray-700";

    const title: HTMLHeadingElement = document.createElement("h2");
    title.innerHTML = translatedRegister;
    title.className = "text-3xl font-bold mb-4 text-center text-blue-400";

    const username: HTMLInputElement = document.createElement("input");
    username.type = "text";
    username.placeholder = translatedUsernameInput;
    username.className = "input-style";

    const email: HTMLInputElement = document.createElement("input");
    email.type = "email";
    email.placeholder = translatedEmailInput;
    email.className = "input-style";

    const password: HTMLInputElement = document.createElement("input");
    password.type = "password";
    password.placeholder = (localStorage.getItem("language") === "en") ? "Password" : translatedPwdInput;
    password.className = "input-style";

    const confirmPassword: HTMLInputElement = document.createElement("input");
    confirmPassword.type = "password";
    confirmPassword.placeholder = translatedConfirmPwdInput;
    confirmPassword.className = "input-style";

    const errorMsg: HTMLParagraphElement = document.createElement("p");
    errorMsg.className = "text-red-500 text-sm mt-2 hidden";

    const submit: HTMLButtonElement = document.createElement("button");
    submit.innerHTML = translatedBtnRegister;
    submit.className = "btn-primary";
    submit.onclick = async (e) => {
        e.preventDefault();
        errorMsg.classList.add("hidden");

        try {
            if (password.value != confirmPassword.value)
                throw new Error("Les mots de passe ne sont pas identiques");
            if (!email.value.includes("@"))
                throw new Error("L'email n'est pas valide");
            await register(username.value, email.value, password.value);
            let langue: string | null = localStorage.getItem("language");
            if (!langue)
                langue = "fr";
            await login(username.value, password.value, true, langue);
            navigateTo(new Event("click"), "/matches");
        } catch (error) {
            errorMsg.innerHTML = `${translatedErrorOnly} :  ${await translateText(error.message)}`;
            errorMsg.classList.remove("hidden");
        }
    };

    const loginLink: HTMLAnchorElement = document.createElement("a");
    loginLink.innerHTML = translatedAlreadyRegistered;
    loginLink.className = "text-blue-400 hover:underline mt-3 cursor-pointer";
    loginLink.onclick = (e) => {
        e.preventDefault();
        navigateTo(new Event("click"), "/login");
    };

    const languageDiv: HTMLDivElement = document.createElement("div");
    languageDiv.className = "mt-auto mb-4 flex p-3 flex-row flex-wrap justify-around items-center";
    const btnEN: HTMLButtonElement = document.createElement("button");
    const btnES: HTMLButtonElement = document.createElement("button");
    const btnFR: HTMLButtonElement = document.createElement("button");
    btnEN.innerHTML = "🇺🇸";
    btnEN.className = "px-1 m-1 border-2 border-red-500/75 rounded hover:bg-red-700 duration-500";
    
    btnES.innerHTML = "🇪🇦";
    btnES.className = "px-1 m-1 border-2 border-yellow-500/75 rounded hover:bg-yellow-700 duration-500";
    
    btnFR.innerHTML = "🇨🇵";
    btnFR.className = "px-1 m-1 border-2 border-blue-500/75 rounded hover:bg-blue-700 duration-500";
    languageDiv.appendChild(btnEN);
    languageDiv.appendChild(btnES);
    languageDiv.appendChild(btnFR);

    btnEN.onclick = async () => {
        const langue: string = "en";
        localStorage.setItem("language", langue);
        window.location.reload();
    };
    btnES.onclick = async () => {
        const langue: string = "es";
        localStorage.setItem("language", langue);
        window.location.reload();
    };
    btnFR.onclick = async () => {
        const langue: string = "fr";
        localStorage.setItem("language", langue);
        window.location.reload();
    };

    form.append(title, username, email, password, confirmPassword, errorMsg, submit, loginLink, languageDiv);
    return form;
}
