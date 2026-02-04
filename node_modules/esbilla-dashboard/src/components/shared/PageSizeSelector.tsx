interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  options?: number[];
}

export function PageSizeSelector({
  pageSize,
  onPageSizeChange,
  options = [10, 25, 50, 100]
}: PageSizeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="page-size" className="text-sm text-stone-600 whitespace-nowrap">
        Mostrar
      </label>
      <select
        id="page-size"
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <span className="text-sm text-stone-600 whitespace-nowrap">por página</span>
    </div>
  );
}
