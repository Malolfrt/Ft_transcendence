import Home from "./pages/home";
import Dashboard from "./pages/profile/Dashboard";
import UserProfile from "./pages/profile/UserProfile";
import Login from "./pages/login";
import Register from "./pages/register";
import Matches from "./pages/matches";
import LocalMatch from "./pages/localMatch"
import GameLocal from "./pages/gameLocal"
import GameAI from "./pages/gameAI";
import TournamentSettings from "./pages/tournamentSettings";
import TournamentBracket from "./pages/tournamentBracket";
import GameTournament from "./pages/gameTournament";
import { isAuthenticated } from "./services/auth";
import { state } from "./state";
import Sidebar from "./components/sidebar";
import Rules from "./pages/rules";

function restoreStateFromLocalStorage() {
    const currentPage = localStorage.getItem('currentPage');
    
    if (localStorage.getItem('userData')) {
        try {
            state.user = JSON.parse(localStorage.getItem('userData')!);
        } catch (error) {
            console.error("Erreur lors de la restauration des données utilisateur:", error);
        }
    }
    
    if (localStorage.getItem('localMatchData')) {
        try {
            state.localMatch = JSON.parse(localStorage.getItem('localMatchData')!);
        } catch (error) {
            console.error("Erreur lors de la restauration des données de match local:", error);
        }
    }
    
    if (localStorage.getItem('tournamentData')) {
        try {
            state.tournament = JSON.parse(localStorage.getItem('tournamentData')!);
            
            if (localStorage.getItem('currentMatchData') && state.tournament) {
                state.tournament.currentMatch = JSON.parse(localStorage.getItem('currentMatchData')!);
            }
        } catch (error) {
            console.error("Erreur lors de la restauration des données de tournoi:", error);
        }
    }
}

const routes: Record<string, () => Promise<HTMLElement> | HTMLElement> = {
  "/": Home,
  "/dashboard": async () => (isAuthenticated() ? await Dashboard() : await Login()),
  "/login": Login,
  "/matches": async () => (isAuthenticated() ? await Matches() : await Login()),
  "/tournament": async () => TournamentSettings(),
  "/tournament-bracket": async () => (isAuthenticated() ? await TournamentBracket() : await Login()),
  "/tournament-game": async () => (isAuthenticated() ? await GameTournament() : await Login()),
  "/local-match": LocalMatch,
  "/game-local": async () => GameLocal(),
  "/game-ai": async () => (isAuthenticated() ? GameAI() : await Login()),
  "/register": Register,
  "/rules": async () => (isAuthenticated() ? await Rules() : await Login())
};

export function navigateTo(event: Event, path: string, popstate: boolean = false) {
  event.preventDefault();
  
  if (path.includes('game-ai') || path.includes('game-local') || path.includes('tournament-game')) {
    
    if (path.includes('game-ai')) {
      localStorage.removeItem('aiGameScores');
      localStorage.removeItem('aiGameState');
    }
    else if (path.includes('game-local')) {
      localStorage.removeItem('localGameScores');
      localStorage.removeItem('gameState');
    }
    else if (path.includes('tournament-game')) {
      localStorage.removeItem('tournamentGameScores');
      localStorage.removeItem('tournamentGameState');
    }
    
    const victoryOverlays = document.querySelectorAll('.victory-container');
    victoryOverlays.forEach(overlay => overlay.remove());
  }
  
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event("popstate"));
}

(window as any).navigateTo = navigateTo;

export function initRouter() {
  restoreStateFromLocalStorage();

  const app = document.getElementById("app");
  if (!app) return;

  const render: () => Promise<void> = async () => {
    setTimeout(async () => {
      const path: string = window.location.pathname;
      
      const currentPage = localStorage.getItem('currentPage');
      if (path === '/' && currentPage) {
        if (currentPage === 'game-local' && state.localMatch)
          window.history.replaceState({}, "", "/game-local");
        else if (currentPage === 'tournament-game' && state.tournament && state.tournament.currentMatch)
          window.history.replaceState({}, "", "/tournament-game");
        else if (currentPage === 'game-ai' && state.aiMatch)
          window.history.replaceState({}, "", "/game-ai");
      }
      
      const newPath = window.location.pathname;
      
      const profilePattern = /^\/profile\/(\d+)$/;
      const profileMatch = newPath.match(profilePattern);
      
      if (profileMatch && profileMatch[1]) {
        const userId = Number(profileMatch[1]);
        app.innerHTML = "";
        if (isAuthenticated()) {
          try {
            const profileComponent = await UserProfile(userId);
            app.appendChild(profileComponent);
          } catch (error) {
            app.appendChild(await Login());
          }
        } else {
          app.appendChild(await Login());
        }
      } else {
        const page: () => Promise<HTMLElement> | HTMLElement = routes[newPath] || Home;
        app.innerHTML = "";
        app.appendChild(await page());
      }

      if (state.user && !document.querySelector(".sidebar-component")) {
        const sidebarContainer = document.createElement("div");
        sidebarContainer.className = "sidebar-container";
        Sidebar().then(container => {
          sidebarContainer.append(container);
        })
        document.body.appendChild(sidebarContainer);
      }
    }, 100);
  };

  window.addEventListener("popstate", render);
  render();
}
