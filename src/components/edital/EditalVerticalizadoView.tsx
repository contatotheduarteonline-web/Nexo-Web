import React from "react";
import { EditalView } from "./EditalView";

interface EditalVerticalizadoViewProps {
  onOpenAiImport?: () => void;
  onOpenNewTopicModal?: (disciplineId?: string) => void;
  onOpenManualStudy?: (disciplineId: string, topicId: string) => void;
}

export const EditalVerticalizadoView: React.FC<EditalVerticalizadoViewProps> = () => {
  return <EditalView />;
};

export { EditalView };
