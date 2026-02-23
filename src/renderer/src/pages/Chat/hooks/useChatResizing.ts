import { useEffect, useRef, useState } from "react";

export function useChatResizing() {
  const [leftWidth, setLeftWidth] = useState(() => {
    const saved = localStorage.getItem("ProxyBat:leftSidebarWidth");
    return saved ? parseInt(saved, 10) : 208;
  });
  const [rightWidth, setRightWidth] = useState(() => {
    const saved = localStorage.getItem("ProxyBat:rightPanelWidth");
    return saved ? parseInt(saved, 10) : 720;
  });

  const leftDragRef = useRef(false);
  const rightDragRef = useRef(false);
  const leftDragStartX = useRef(0);
  const leftDragStartW = useRef(0);
  const rightDragStartX = useRef(0);
  const rightDragStartW = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (leftDragRef.current) {
        const delta = e.clientX - leftDragStartX.current;
        setLeftWidth(
          Math.min(Math.max(leftDragStartW.current + delta, 150), 400),
        );
      }
      if (rightDragRef.current) {
        const delta = rightDragStartX.current - e.clientX;
        setRightWidth(
          Math.min(Math.max(rightDragStartW.current + delta, 320), 900),
        );
      }
    };
    const onUp = () => {
      if (leftDragRef.current || rightDragRef.current) {
        leftDragRef.current = false;
        rightDragRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setLeftWidth((w) => {
          localStorage.setItem("ProxyBat:leftSidebarWidth", String(w));
          return w;
        });
        setRightWidth((w) => {
          localStorage.setItem("ProxyBat:rightPanelWidth", String(w));
          return w;
        });
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startLeftDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    leftDragRef.current = true;
    leftDragStartX.current = e.clientX;
    leftDragStartW.current = leftWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const startRightDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    rightDragRef.current = true;
    rightDragStartX.current = e.clientX;
    rightDragStartW.current = rightWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return {
    leftWidth,
    rightWidth,
    startLeftDrag,
    startRightDrag,
  };
}
