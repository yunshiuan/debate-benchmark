import ConversationExplorerHeader from "@/components/ConversationExplorerHeader";
import ExplorerClient from "@/components/ExplorerClient";

export default function ConversationExplorer() {
  return <main className="min-h-screen bg-gray-50 font-sans"><ConversationExplorerHeader /><div className="max-w-7xl mx-auto px-4 py-8"><ExplorerClient kind="conversation" /></div></main>;
}
