export default function BackButton(): HTMLElement {
    const backButton: HTMLDivElement = document.createElement("div");
    backButton.className = "absolute top-4 sm:top-6 left-4 sm:left-6 w-10 h-10 sm:w-12 sm:h-12 bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer text-white text-base sm:text-xl transition duration-300 transform hover:scale-110 hover:bg-gray-600 shadow-lg z-10 md:ml-64";
    backButton.innerHTML = `<svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg>`;
    backButton.onclick = () => {
        window.history.back();
    };
    return backButton;
}
