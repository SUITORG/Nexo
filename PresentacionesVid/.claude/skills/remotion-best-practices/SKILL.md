---
name: remotion-best-practices
description: Best practices for Remotion - Video creation in React
metadata:
  tags: remotion, video, react, animation, composition
---

## When to use

Use this skills whenever you are dealing with Remotion code to obtain the domain-specific knowledge.

## New project setup

When in an empty folder or workspace with no existing Remotion project, scaffold one using:

```bash
npx create-video@latest --yes --blank --no-tailwind my-video
```

Replace `my-video` with a suitable project name.

## Designing a video

Before designing visual scenes, layouts, promos, motion graphics, or text-heavy videos, load [rules/video-layout.md](rules/video-layout.md) for video-first layout and text sizing guidance.

Animate properties using `useCurrentFrame()` and `interpolate()`. Prefer `interpolate()` over `spring()` unless physics-based motion is explicitly needed. Use `Easing.bezier()` to customize timing, including jumpy or overshooting motion.

For animations that should be editable in Remotion Studio, keep the `interpolate()` call inline in the `style` prop and use individual CSS transform properties (`scale`, `translate`, `rotate`) instead of composing a `transform` string.

```tsx
import { useCurrentFrame, Easing, interpolate, useVideoConfig } from "remotion";

export const FadeIn = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 2 * fps], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return <div style={{ opacity }}>Hello World!</div>;
};
```

Prefer:

```tsx
style={{
  scale: interpolate(frame, [0, 100], [0, 1]),
  translate: interpolate(frame, [0, 100], ["0px 0px", "100px 100px"]),
  rotate: interpolate(frame, [0, 100], ["20deg", "90deg"]),
}}
```

Over:

```tsx
const scale = interpolate(frame, [0, 100], [0, 1]);

style={{
  transform: `scale(${scale})`,
}}
```

CSS transitions or animations are FORBIDDEN - they will not render correctly.
Tailwind animation class names are FORBIDDEN - they will not render correctly.

Place assets in the `public/` folder at your project root.

Use `staticFile()` to reference files from the `public/` folder.

Add images using the `<Img>` component:

```tsx
import { Img, staticFile } from "remotion";

export const MyComposition = () => {
  return <Img src={staticFile("logo.png")} style={{ width: 100, height: 100 }} />;
};
```

Add videos using the `<Video>` component from `@remotion/media`:

```tsx
import { Video } from "@remotion/media";
import { staticFile } from "remotion";

export const MyComposition = () => {
  return <Video src={staticFile("video.mp4")} style={{ opacity: 0.5 }} />;
};
```

Add audio using the `<Audio>` component from `@remotion/media`:

```tsx
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";

export const MyComposition = () => {
  return <Audio src={staticFile("audio.mp3")} />;
};
```

Assets can be also referenced as remote URLs:

```tsx
import { Video } from "@remotion/media";

export const MyComposition = () => {
  return <Video src="https://remotion.media/video.mp4" />;
};
```

To delay content wrap it in `<Sequence>` and use `from`.
To limit the duration of an element, use `durationInFrames` of `<Sequence>`.
`<Sequence>` by default is an absolute fill. For inline content, use `layout="none"`.

```tsx
import { Sequence } from "remotion";

export const Title = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 2 * fps], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return <div style={{ opacity }}>Title</div>;
};

export const Subtitle = () => {
  return <div>Subtitle</div>;
};

const Main = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Sequence>
        <Background />
      </Sequence>
      <Sequence from={1 * fps} durationInFrames={2 * fps} layout="none">
        <Title />
      </Sequence>
      <Sequence from={2 * fps} durationInFrames={2 * fps} layout="none">
        <Subtitle />
      </Sequence>
    </AbsoluteFill>
  );
};
```

The width, height, fps, and duration of a video is defined in `src/Root.tsx`:

```tsx
import { Composition } from "remotion";
import { MyComposition } from "./MyComposition";

export const RemotionRoot = () => {
  return (
    <Composition
      id="MyComposition"
      component={MyComposition}
      durationInFrames={100}
      fps={30}
      width={1080}
      height={1080}
    />
  );
};
```

Metadata can also be calculated dynamically:

```tsx
import { Composition, CalculateMetadataFunction } from "remotion";
import { MyComposition, MyCompositionProps } from "./MyComposition";

const calculateMetadata: CalculateMetadataFunction<MyCompositionProps> = async ({ props, abortSignal }) => {
  const data = await fetch(`https://api.example.com/video/${props.videoId}`, {
    signal: abortSignal,
  }).then((res) => res.json());

  return {
    durationInFrames: Math.ceil(data.duration * 30),
    props: {
      ...props,
      videoUrl: data.url,
    },
    width: 1080,
    height: 1080,
  };
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="MyComposition"
      component={MyComposition}
      fps={30}
      width={1080}
      height={1080}
      defaultProps={{ videoId: "abc123" }}
      calculateMetadata={calculateMetadata}
    />
  );
};
```

## Starting preview

Start the Remotion Studio to preview a video:

```bash
npx remotion studio
```

## Optional: one-frame render check

```bash
npx remotion still [composition-id] --scale=0.25 --frame=30
```

## Captions

When dealing with captions or subtitles, load the [./rules/subtitles.md](./rules/subtitles.md) file for more information.

## Using FFmpeg

Load the [./rules/ffmpeg.md](./rules/ffmpeg.md) file for more information.

## Silence detection

Load the [./rules/silence-detection.md](./rules/silence-detection.md) file.

## Audio visualization

Load the [./rules/audio-visualization.md](./rules/audio-visualization.md) file.

## Sound effects

Load the [./rules/sfx.md](./rules/sfx.md) file.

## Visual and pixel effects

See [rules/effects.md](rules/effects.md) for available effects.

## 3D content

See [rules/3d.md](rules/3d.md) for 3D content in Remotion using Three.js and React Three Fiber.

## Advanced audio

See [rules/audio.md](rules/audio.md) for advanced audio features.

## Dynamic duration, dimensions and data

See [rules/calculate-metadata.md](rules/calculate-metadata.md).

## Advanced compositions

See [rules/compositions.md](rules/compositions.md).

## Google Fonts

See [rules/google-fonts.md](rules/google-fonts.md).

## Local fonts

See [rules/local-fonts.md](rules/local-fonts.md).

## Getting audio duration

See [rules/get-audio-duration.md](rules/get-audio-duration.md).

## Getting video dimensions

See [rules/get-video-dimensions.md](rules/get-video-dimensions.md).

## Getting video duration

See [rules/get-video-duration.md](rules/get-video-duration.md).

## GIFs

See [rules/gifs.md](rules/gifs.md).

## Advanced Images

See [rules/images.md](rules/images.md).

## Lottie animations

See [rules/lottie.md](rules/lottie.md).

## Measuring DOM nodes

See [rules/measuring-dom-nodes.md](rules/measuring-dom-nodes.md).

## Measuring text

See [rules/measuring-text.md](rules/measuring-text.md).

## Advanced sequencing

See [rules/sequencing.md](rules/sequencing.md).

## TailwindCSS

See [rules/tailwind.md](rules/tailwind.md).

## Text animations

See [rules/text-animations.md](rules/text-animations.md).

## Advanced timing

See [rules/timing.md](rules/timing.md).

## Transitions

See [rules/transitions.md](rules/transitions.md).

## Transparent videos

See [rules/transparent-videos.md](rules/transparent-videos.md).

## Trimming

See [rules/trimming.md](rules/trimming.md).

## Advanced Videos

See [rules/videos.md](rules/videos.md).

## Parameterized videos

See [rules/parameters.md](rules/parameters.md).

## Maps

For simple maps use static map images. For complex maps with animated routes, load [rules/maplibre.md](rules/maplibre.md).

## Voiceover

See [rules/voiceover.md](rules/voiceover.md) for AI-generated voiceover using ElevenLabs TTS.
