"use client";

import { useCallback, useMemo, useState } from "react";
import { Box, Button, Card, Flex, Stack, Text, TextInput } from "@sanity/ui";
import {
  insert,
  set,
  useFormValue,
  type ArrayOfObjectsInputProps,
} from "sanity";
import { randomKey } from "@sanity/util/content";
import { buildPageNumbering, isSpreadImage } from "@/lib/pageLayout";
import { HotspotCanvas, type CanvasHotspot } from "./HotspotCanvas";
import type { HotspotBoxValue } from "./hotspotMath";

type PageValue = {
  _key: string;
  key: string;
  width?: number;
  height?: number;
  layout?: string;
};

type HotspotItem = {
  _key: string;
  pageNumber?: number;
  label?: string;
  left?: number;
  right?: number;
  top?: number;
  height?: number;
};

function hasPlacement(item: HotspotItem): item is HotspotItem & CanvasHotspot {
  return (
    typeof item.left === "number" &&
    typeof item.right === "number" &&
    typeof item.top === "number" &&
    typeof item.height === "number"
  );
}

/**
 * Replaces blind `left`/`right`/`top`/`height` percentage entry with a canvas
 * showing the actual page image: draw a box to create a hotspot, drag/resize
 * an existing one to reposition it. Lives on the `hotspots` array (not the
 * `hotspot` object) so one page image loads once and can hold several
 * hotspots at a time — e.g. the back cover's Instagram handle and email.
 *
 * `target`/`link`/`customHref`/`label` aren't the pain point (placement is),
 * so they stay on Sanity's own default array-item accordion, rendered via
 * `renderDefault` below the canvas — the same pattern `R2PagesInput` uses.
 */
export function HotspotsInput(props: ArrayOfObjectsInputProps) {
  const { value, onChange, renderDefault } = props;
  const pagesValue = useFormValue(["pages"]) as PageValue[] | undefined;
  // The `?? []` would otherwise mint a new array every render and re-run every
  // memo below it.
  const pages = useMemo(() => pagesValue ?? [], [pagesValue]);
  const items = useMemo(() => (value as HotspotItem[] | undefined) ?? [], [value]);

  const [currentPage, setCurrentPage] = useState(() => {
    const first = items[0]?.pageNumber;
    return first && first >= 1 ? first : 1;
  });

  const page = pages[currentPage - 1];

  // The paginator addresses IMAGES (so does hotspot.pageNumber), but an editor
  // holding the printed magazine counts printed pages, and a spread makes the
  // two diverge. Show both so the numbers can be reconciled here.
  const numbering = useMemo(
    () =>
      buildPageNumbering(
        pages.map((p) => isSpreadImage(p.layout, p.width, p.height)),
      ),
    [pages],
  );
  const printedLabel = (() => {
    const first = numbering.first[currentPage - 1];
    const last = numbering.last[currentPage - 1];
    if (!first) return null;
    return first === last ? `printed page ${first}` : `printed pages ${first}–${last}`;
  })();

  const pageHotspots = useMemo(
    () =>
      items.filter(
        (item): item is HotspotItem & CanvasHotspot =>
          item.pageNumber === currentPage && hasPlacement(item),
      ),
    [items, currentPage],
  );

  const goToPage = useCallback(
    (n: number) => {
      setCurrentPage(Math.min(Math.max(Math.round(n) || 1, 1), Math.max(pages.length, 1)));
    },
    [pages.length],
  );

  const handleCreate = useCallback(
    (box: HotspotBoxValue) => {
      onChange(
        insert(
          [
            {
              _type: "hotspot",
              _key: randomKey(12),
              pageNumber: currentPage,
              target: "link",
              ...box,
            },
          ],
          "after",
          [-1],
        ),
      );
    },
    [currentPage, onChange],
  );

  const handleUpdate = useCallback(
    (key: string, box: HotspotBoxValue) => {
      onChange([
        set(box.left, [{ _key: key }, "left"]),
        set(box.right, [{ _key: key }, "right"]),
        set(box.top, [{ _key: key }, "top"]),
        set(box.height, [{ _key: key }, "height"]),
      ]);
    },
    [onChange],
  );

  return (
    <Stack space={4}>
      {pages.length === 0 ? (
        <Card padding={3} radius={2} tone="caution" border>
          <Text size={1}>Upload pages first, in the Pages tab.</Text>
        </Card>
      ) : (
        <Card padding={3} radius={2} border>
          <Stack space={3}>
            <Flex align="center" gap={2}>
              <Button
                mode="ghost"
                text="←"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              />
              <Box flex={1}>
                <Stack space={2}>
                  <Flex align="center" gap={2} justify="center">
                    <Text size={1} muted>
                      Image
                    </Text>
                    <Box style={{ width: 64 }}>
                      <TextInput
                        type="number"
                        value={String(currentPage)}
                        onChange={(e) => goToPage(Number(e.currentTarget.value))}
                      />
                    </Box>
                    <Text size={1} muted>
                      of {pages.length}
                    </Text>
                  </Flex>
                  {printedLabel && (
                    <Flex justify="center">
                      <Text size={0} muted>
                        {printedLabel}
                      </Text>
                    </Flex>
                  )}
                </Stack>
              </Box>
              <Button
                mode="ghost"
                text="→"
                disabled={currentPage >= pages.length}
                onClick={() => goToPage(currentPage + 1)}
              />
            </Flex>

            {page ? (
              <>
                <Text size={1} muted>
                  Drag on the page to draw a new link. Drag an existing box to
                  move it, or its edges to resize it.
                </Text>
                <HotspotCanvas
                  page={page}
                  hotspots={pageHotspots}
                  onCreate={handleCreate}
                  onUpdate={handleUpdate}
                />
              </>
            ) : (
              <Text size={1} muted>
                No page uploaded at this position.
              </Text>
            )}
          </Stack>
        </Card>
      )}

      <Box>{renderDefault(props)}</Box>
    </Stack>
  );
}
