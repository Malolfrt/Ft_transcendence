import { state } from "../state";
import Sidebar from "./sidebar";

export default function Layout(pageContent: HTMLElement) {
  const container: HTMLDivElement = document.createElement("div");
  container.className = "min-h-screen flex flex-col bg-gray-900 text-white";

  if (state.user) {
    if (!document.querySelector(".sidebar-container")) {
      const sidebarContainer = document.createElement("div");
      sidebarContainer.className = "sidebar-container";
      Sidebar().then(container => {
        sidebarContainer.appendChild(container);
      })
      document.body.appendChild(sidebarContainer);
    }
    container.classList.add("ml-64");
  }
  const contentWrapper: HTMLDivElement = document.createElement("div");
  contentWrapper.className = "flex flex-col items-center justify-center min-h-screen mt-16 px-4 w-full";

  contentWrapper.appendChild(pageContent);
  container.appendChild(contentWrapper);

  return container;
}
