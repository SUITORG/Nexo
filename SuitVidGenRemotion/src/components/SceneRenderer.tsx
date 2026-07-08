import type { Scene } from "../types/script";
import { IntroScene } from "./scenes/IntroScene";
import { TextScene } from "./scenes/TextScene";
import { ProductScene } from "./scenes/ProductScene";
import { OutroScene } from "./scenes/OutroScene";

export const SceneRenderer: React.FC<{ scene: Scene }> = ({ scene }) => {
  switch (scene.type) {
    case "intro":
      return <IntroScene scene={scene} />;
    case "text":
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
