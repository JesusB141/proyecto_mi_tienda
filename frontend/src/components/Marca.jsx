/** Marca de la aplicación: un toldo de tienda de barrio. */
export default function Marca({ tamano = 34 }) {
  return (
    <svg className="marca" width={tamano} height={tamano} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="9" fill="var(--primario)" />
      <path d="M8 15h24l-2.2-6H10.2z" fill="var(--sobre-primario)" />
      <path d="M8 15c0 2.2 1.8 4 4 4s4-1.8 4-4c0 2.2 1.8 4 4 4s4-1.8 4-4c0 2.2 1.8 4 4 4s4-1.8 4-4" fill="none" stroke="var(--sobre-primario)" strokeWidth="2" />
      <path d="M11 21v10h18V21" fill="none" stroke="var(--sobre-primario)" strokeWidth="2.2" strokeLinejoin="round" />
      <rect x="17" y="24" width="6" height="7" fill="var(--sobre-primario)" />
    </svg>
  );
}
