import PersonaExplorerHeader from "@/components/PersonaExplorerHeader";
import ExplorerClient from "@/components/ExplorerClient";

export default function PersonaExplorer() {
  return <main className="min-h-screen bg-gray-50 font-sans"><PersonaExplorerHeader /><div className="max-w-7xl mx-auto px-4 py-8"><ExplorerClient kind="persona" /></div></main>;
}
