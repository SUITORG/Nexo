import type { Scene } from "../types/script";
import { IntroScene } from "./scenes/IntroScene";
import { TextScene } from "./scenes/TextScene";
import { PaperTextScene } from "./scenes/PaperTextScene";
import { PinterestAdScene } from "./scenes/PinterestAdScene";
import { RankingTarjetasScene } from "./scenes/RankingTarjetasScene";
import { DiarioIlustradoScene } from "./scenes/DiarioIlustradoScene";
import { CosmicListicleScene } from "./scenes/CosmicListicleScene";
import { PizarraMinimalistaScene } from "./scenes/PizarraMinimalistaScene";
import { ProductScene } from "./scenes/ProductScene";
import { OutroScene } from "./scenes/OutroScene";

export const SceneRenderer: React.FC<{ scene: Scene }> = ({ scene }) => {
  switch (scene.type) {
    case "intro":
      return <IntroScene scene={scene} />;
    case "text":
      if (scene.visual_style === "paper") return <PaperTextScene scene={scene} />;
      if (scene.visual_style === "pinterest_ad") return <PinterestAdScene scene={scene} />;
      if (scene.visual_style === "ranking_tarjetas") return <RankingTarjetasScene scene={scene} />;
      if (scene.visual_style === "diario_ilustrado") return <DiarioIlustradoScene scene={scene} />;
      if (scene.visual_style === "cosmic_listicle_dorado") return <CosmicListicleScene scene={scene} />;
      if (scene.visual_style === "pizarra_minimalista") return <PizarraMinimalistaScene scene={scene} />;
      return <TextScene scene={scene} />;
    case "product":
      return <ProductScene scene={scene} />;
    case "outro":
      return <OutroScene scene={scene} />;
    default:
      return (
        <div style={{ color: "white", fontSize: 24, textAlign: "center", padding: 100 }}>
          Unknown scene type
        </div>
      );
  }
};
