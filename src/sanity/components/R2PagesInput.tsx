"use client";

import { useCallback, useRef, useState } from "react";
import { Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";
import { insert, useFormValue, type ArrayOfObjectsInputProps } from "sanity";
import { randomKey } from "@sanity/util/content";
import { useR2Upload } from "./useR2Upload";

/** Dropzone + renderDefault, inheriting Sanity's own drag-to-reorder and delete
    UI. Array order is page order. */
export function R2PagesInput(props: ArrayOfObjectsInputProps) {
  const { onChange, renderDefault } = props;
  const issueId = (useFormValue(["_id"]) as string | undefined) ?? "";
  const { uploadFiles, progress } = useR2Upload(issueId.replace(/^drafts\./, ""));

  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (images.length === 0) return;

      setError(null);
      try {
        const uploaded = await uploadFiles(images);
        onChange(
          insert(
            uploaded.map((page) => ({
              _type: "r2Image",
              _key: randomKey(12),
              ...page,
            })),
            "after",
            [-1],
          ),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [onChange, uploadFiles],
  );

  const busy = progress !== null;

  return (
    <Stack space={3}>
      <Card
        padding={4}
        radius={2}
        tone={dragging ? "primary" : "transparent"}
        border
        style={{
          borderStyle: "dashed",
          textAlign: "center",
          opacity: busy ? 0.6 : 1,
        }}
        onDragOver={(e: React.DragEvent) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e: React.DragEvent) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) void handleFiles([...e.dataTransfer.files]);
        }}
      >
        <Stack space={3}>
          <Text size={1} muted>
            {busy
              ? `Uploading ${progress.done + 1}/${progress.total}${
                  progress.current ? ` (${progress.current})` : ""
                }`
              : "Drag page images here, ordered by filename"}
          </Text>
          <Flex justify="center">
            <Button
              mode="ghost"
              text="Choose files"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            />
          </Flex>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(e) => {
              void handleFiles([...(e.target.files ?? [])]);
              e.target.value = "";
            }}
          />
        </Stack>
      </Card>

      {error && (
        <Card padding={3} radius={2} tone="critical" border>
          <Text size={1}>{error}</Text>
        </Card>
      )}

      <Box>{renderDefault(props)}</Box>
    </Stack>
  );
}
