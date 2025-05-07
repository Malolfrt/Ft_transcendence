export default function StarsBackground(): HTMLElement {
    const starsContainer = document.createElement("div");
    starsContainer.className = "absolute top-0 left-0 w-full h-full bg-stars pointer-events-none z-0";
    return starsContainer;
}
