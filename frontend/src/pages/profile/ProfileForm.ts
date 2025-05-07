import { state } from "../../state";
import { updatePhotoUser, updateUser, deleteUser, anonymizeUser, getQrcode } from "../../services/userService";
import { uploadFile } from "../../services/uploadFile";
import { logout } from "../../services/auth";
import { displayModalQRCode } from "../displayModalQRCode";
import { translateText } from "../../translate";
import API_CONFIG from "../../config/apiConfig";

export default async function ProfileForm(): Promise<HTMLDivElement> {
    const textsToTranslate = [
        "Gestion de profil",
        "Changer de photo",
        "Choisir la photo",
        "Mettre la photo à jour",
        "Votre compte doit être en publique !",
        "Image non valide",
        "Mettre le profil à jour",
        "Se mettre en privé",
        "Se mettre en publique",
        "êtes-vous sûr ?",
        "Supprimer mon compte",
        "Activer 2FA",
        "Echec du téléchargement de l'image",
        "Erreur de mise à jour du profil",
        "Erreur de la requête du profil",
        "Une erreur est survenue",
        "Erreur lors de la suppression du profil",

    ];

    const [
        translatedProfilGes,
        translatedChangeAvatar, 
        translatedChooseAvatar, 
        translatedUpdateAvatar, 
        translatedNeedPublicAccount, 
        translatedNotValidAvatar, 
        translatedUpdateProfil,
        translatedGoingPrivate,
        translatedGoingPublic,
        translatedAreYouSure,
        translatedDeleteAccount,
        transletedActivate2FA,
        translatedErrorDownloadAvatar,
        translatedErrorUpdateProfil,
        translatedErrorRequestProfil,
        translatedError,
        translatedErrorDeleteProfil
    ] = await Promise.all(textsToTranslate.map(text => translateText(text)));

    const container: HTMLDivElement = document.createElement("div");
    container.className = "flex flex-col items-center p-6 bg-gray-800 text-white rounded-xl shadow-lg w-full h-full test";
    
    const title: HTMLHeadingElement = document.createElement("h2");
    title.innerHTML = translatedProfilGes;
    title.className = "text-2xl text-blue-400 font-bold mb-6";
    
    const divAvatar: HTMLDivElement = document.createElement("div");
    divAvatar.className = "flex flex-col items-center justify-center w-full mb-6";
    
    const avatar: HTMLImageElement = document.createElement("img");
    avatar.src = `${API_CONFIG.API_BASE_URL}/images/` + state.user.avatar || `${API_CONFIG.API_BASE_URL}/images/default.jpg`;
    avatar.className = "w-24 h-24 rounded-full border-2 border-blue-400 mb-4";
    divAvatar.appendChild(avatar);
    
    const btnRequestPhoto: HTMLButtonElement = document.createElement("button");
    btnRequestPhoto.innerHTML = translatedChangeAvatar;
    btnRequestPhoto.className = "bg-gray-700 hover:bg-gray-600 text-white rounded px-4 py-2 font-semibold text-sm";
    divAvatar.appendChild(btnRequestPhoto);
    
    const divUpdatePhoto: HTMLDivElement = document.createElement("div");
    divUpdatePhoto.className = "hidden w-full";
    const form: HTMLFormElement = document.createElement("form");
    form.method = "POST";
    form.enctype = "multipart/form-data";
    form.className = "w-full";
    const labelFile: HTMLLabelElement = document.createElement("label");
    labelFile.innerHTML = translatedChooseAvatar;
    labelFile.className = "mb-3 text-sm";
    const inputFile: HTMLInputElement = document.createElement("input");
    inputFile.type = "file";
    inputFile.accept = ".png, .jpeg, .jpg";
    inputFile.className = "text-sm w-full mb-2";
    const submitFile: HTMLButtonElement = document.createElement("button");
    submitFile.innerHTML = translatedUpdateAvatar;
    submitFile.className = "w-full bg-blue-500 hover:bg-blue-600 rounded py-2 px-4 text-sm";
    form.appendChild(labelFile);
    form.appendChild(inputFile);
    form.appendChild(submitFile);
    divUpdatePhoto.appendChild(form);
    divAvatar.appendChild(divUpdatePhoto);

    btnRequestPhoto.onclick = () => {
        if (state.user.anonymize)
            return alert(translatedNeedPublicAccount);
        divUpdatePhoto.classList.remove("hidden");
        btnRequestPhoto.classList.add("hidden");
    }
    submitFile.onclick = async (e) => {
        e.preventDefault();
        if (!inputFile.files?.length)
            return alert(translatedNotValidAvatar);

        const formData: FormData = new FormData();
        formData.append('image', inputFile.files[0]);
        const response = await uploadFile(formData);
        if (!response || !response.filename)
            return alert(translatedErrorDownloadAvatar);
        const success: boolean = await updatePhotoUser(state.user.username, response.filename);
        if (success) {
            state.user.avatar = response.filename;
            localStorage.setItem("user", JSON.stringify(state.user));
            divUpdatePhoto.classList.add("hidden");
            btnRequestPhoto.classList.remove("hidden");
            window.location.reload();
        } else {
            alert(translatedErrorUpdateProfil);
        }
    };

    const formFieldsContainer: HTMLDivElement = document.createElement("div");
    formFieldsContainer.className = "w-full space-y-4";

    const username: HTMLInputElement = document.createElement("input");
    username.type = "text";
    username.value = state.user.username;
    username.className = "w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500";

    const email: HTMLInputElement = document.createElement("input");
    email.type = "email";
    email.value = state.user.email;
    email.className = "w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500";

    formFieldsContainer.append(username, email);

    const anonymize = state.user.anonymize;
    if (anonymize === 1) {
        username.disabled = true;
        email.disabled = true;
    }

    const buttonsContainer: HTMLDivElement = document.createElement("div");
    buttonsContainer.className = "w-full space-y-3 mt-4";

    const saveBtn: HTMLButtonElement = document.createElement("button");
    saveBtn.innerHTML = translatedUpdateProfil;
    saveBtn.disabled = true;
    username.onchange = () => {
        if (!(username.value.length == 0) || username.value == state.user.username)
            saveBtn.disabled = false;
        else
            saveBtn.disabled = true;
    }
    email.onchange = () => {
        if (!(email.value.length == 0) && !(email.value == state.user.email) && email.value.includes("@"))
            saveBtn.disabled = false;
        else
            email.disabled = true;
    }

    saveBtn.className = "w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded";
    if (anonymize === 1)
        saveBtn.disabled = true;
    saveBtn.onclick = async () => {
        let token = state.token;
        if (!token)
            token = "";
        const value: boolean = confirm(translatedAreYouSure);
        if (value)
        {
            const success: boolean = await updateUser(token, state.user.username, username.value, email.value);
            if (success) {
                state.user.username = username.value;
                state.user.email = email.value;
                window.location.reload();
            } else {
                alert(translatedErrorUpdateProfil);
            }
        }
    };

    const anonymizeBtn: HTMLButtonElement = document.createElement("button");
    let token = state.token;
    if (!token)
        token = "";
    if (state.user.anonymize === 0)
        anonymizeBtn.innerHTML = translatedGoingPrivate;
    else
        anonymizeBtn.innerHTML = translatedGoingPublic;
    anonymizeBtn.className = "w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded";
    anonymizeBtn.onclick = async () => {
        try {
            const value: boolean = confirm(translatedAreYouSure);
            if (value) {
                const success: boolean = await anonymizeUser(state.user.username, token);
                if (success && anonymizeBtn.textContent?.includes("priv"))
                        anonymizeBtn.innerHTML = translatedGoingPublic;
                else if (success && anonymizeBtn.textContent?.includes("bli"))
                        anonymizeBtn.innerHTML = translatedGoingPrivate;
                else
                    alert(translatedErrorRequestProfil);
                window.location.reload();
            }
        } catch (error) {
            alert(translatedError);
        }
    };

    const deleteBtn: HTMLButtonElement = document.createElement("button");
    deleteBtn.innerHTML = translatedDeleteAccount;
    deleteBtn.className = "w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded";
    deleteBtn.onclick = async () => {
        try {
            const value: boolean = confirm(translatedAreYouSure);
            if (value) {
                const success: boolean = await deleteUser(state.user.username);
                if (success) {
                    await logout();
                } else {
                    alert(translatedErrorDeleteProfil);
                }
            }
        } catch (error) {
            alert(translatedError);
        }
    };

    const div2FA: HTMLDivElement = document.createElement("div");
    div2FA.className = "flex items-center justify-between w-full mt-4";
    
    const span2FA: HTMLSpanElement = document.createElement("span");
    span2FA.innerHTML = transletedActivate2FA;
    span2FA.className = "text-sm";
    
    const toggleContainer: HTMLDivElement = document.createElement("div");
    toggleContainer.className = "flex";

    const labelBtn: HTMLLabelElement = document.createElement("label");
    labelBtn.className = "switch";
    
    const btnQRCode: HTMLInputElement = document.createElement("input");
    btnQRCode.type = "checkbox";
    if (state.user.is2FAEnabled == 1)
        btnQRCode.checked = true;
    
    const spanQrcode: HTMLSpanElement = document.createElement("span");
    spanQrcode.className = "slider round";
    
    labelBtn.appendChild(btnQRCode);
    labelBtn.appendChild(spanQrcode);
    toggleContainer.appendChild(labelBtn);
    
    div2FA.appendChild(span2FA);
    div2FA.appendChild(toggleContainer);

    displayModalQRCode(btnQRCode, state.user.id, state.user.username, container);

    buttonsContainer.append(saveBtn, anonymizeBtn, deleteBtn);
    container.append(title, divAvatar, formFieldsContainer, buttonsContainer, div2FA);
    return container;
}