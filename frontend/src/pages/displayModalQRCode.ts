import {  getQrcode, update2FAOff } from "../services/userService";
import { state } from "../state";
import { translateText } from "../translate";

export async function displayModalQRCode(btnQRCode , userId, username, container)
{
    const textsToTranslate: string[] = [
        "Scanner le QRCODE sur Google Authenticator",
        "Google Authenticator pour Android",
        "Google Authenticator pour IOS",
        "Erreur QRcode"
    ];

    const [
        translatedScanQRcode,
        translatedGoogleForAndroid, 
        translatedGoogleForIOS,
        translatedAlertQrCode
    ] = await Promise.all(textsToTranslate.map(text => translateText(text)));

    btnQRCode.onclick = async () => 
    {
        if (btnQRCode.checked)
        {
            try
            {
                const bigD: HTMLDivElement = document.createElement("div");
                bigD.classList.add("bigD");
                container.appendChild(bigD);

                const divQrcode: HTMLDivElement = document.createElement("div");
                divQrcode.classList.add("divQrCode")
                
                const divCross: HTMLDivElement = document.createElement("div");
                divCross.style.textAlign = "right";
                
                const btnCross: HTMLButtonElement = document.createElement("button");
                btnCross.innerHTML = "X";
                btnCross.className = "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-5";
                
                divCross.appendChild(btnCross);
                divQrcode.appendChild(divCross);
                
                const   divImageQr: HTMLDivElement = document.createElement("div");
                divImageQr.classList.add("divImageQr")
                
                
                divQrcode.appendChild(divImageQr);
                
                const image: HTMLImageElement = document.createElement("img");
                getQrcode(userId, username).then((data) => {
                    if (data)
                        image.src = data;
                    divImageQr.append(image);
                });

                const linkApp: HTMLParagraphElement = document.createElement("p");
                linkApp.innerHTML = translatedScanQRcode;
                divQrcode.appendChild(linkApp);            
                
                const hrefAppAndroid: HTMLAnchorElement = document.createElement("a");
                hrefAppAndroid.href = "https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2&hl=fr";
                hrefAppAndroid.target = "_blank";
                hrefAppAndroid.innerHTML = translatedGoogleForAndroid + "<br>";
                divQrcode.appendChild(hrefAppAndroid);
                
                const hrefAppIOS: HTMLAnchorElement = document.createElement("a");
                hrefAppIOS.href = "https://apps.apple.com/fr/app/google-authenticator/id388497605";
                hrefAppIOS.target = "_blank";
                hrefAppIOS.innerHTML = translatedGoogleForIOS;
                divQrcode.appendChild(hrefAppIOS);
                
                container.append(divQrcode);
                
                btnCross.onclick = async () => {
                    container.removeChild(divQrcode);
                    container.removeChild(bigD);
                }
                state.user.is2FAEnabled = 1;
                localStorage.setItem("user", JSON.stringify(state.user));
            }
            catch (error) 
            {
                alert(translatedAlertQrCode);
            }
        }
        else
        {
            update2FAOff(userId, username).then ((user) => {
                if (user)
                {
                    state.user.is2FAEnabled = user.is2FAEnabled;
                    localStorage.setItem("user", JSON.stringify(state.user))
                }
            });
        }
    };
}
