// Ícones inline (sem depender de nenhuma lib externa), no estilo outline.
type Props = React.SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconeLapis(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
      <path d="M19.5 13.5v6a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V8.25A2.25 2.25 0 016.75 6h6" />
    </svg>
  );
}

export function IconeLixeira(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

export function IconePlus(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

export function IconeSeta(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}
