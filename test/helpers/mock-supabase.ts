// Mock Supabase client for testing
// Usage: const mockClient = createMockSupabaseClient({ profiles: [...] });

export type MockData = {
  profiles?: any[];
  suppliers?: any[];
  master_items?: any[];
  daily_closings?: any[];
  daily_closing_items?: any[];
  restocks?: any[];
  expenses?: any[];
};

export function createMockSupabaseClient(mockData: MockData = {}) {
  const data: MockData = {
    profiles: [],
    suppliers: [],
    master_items: [],
    daily_closings: [],
    daily_closing_items: [],
    restocks: [],
    expenses: [],
    ...mockData,
  };

  let currentTable: string | null = null;
  let currentFilters: { column: string; value: any; op?: string }[] = [];
  let currentSingle = false;
  let currentOrder: { column: string; ascending: boolean } | null = null;

  const reset = () => {
    currentFilters = [];
    currentSingle = false;
    currentOrder = null;
  };

  const getTableData = () => {
    if (!currentTable) return [];
    let result = [...(data[currentTable as keyof MockData] || [])];

    // Apply filters
    for (const filter of currentFilters) {
      if (filter.op === "lte") {
        result = result.filter((row: any) => row[filter.column] <= filter.value);
      } else {
        result = result.filter((row: any) => row[filter.column] === filter.value);
      }
    }

    // Apply order
    if (currentOrder) {
      result = result.sort((a: any, b: any) => {
        const aVal = a[currentOrder!.column];
        const bVal = b[currentOrder!.column];
        if (aVal < bVal) return currentOrder!.ascending ? -1 : 1;
        if (aVal > bVal) return currentOrder!.ascending ? 1 : -1;
        return 0;
      });
    }

    return result;
  };

  const buildResult = () => {
    const result = getTableData();
    const table = currentTable;
    reset();
    return { data: result, error: null, _table: table };
  };

  return {
    from: (table: string) => {
      currentTable = table;
      reset();

      return {
        select: (_columns = "*") => {
          const chain = {
            eq: (column: string, value: any) => {
              currentFilters.push({ column, value });
              return {
                single: () => {
                  currentSingle = true;
                  const result = getTableData();
                  reset();
                  return Promise.resolve({ data: result[0] ?? null, error: null });
                },
                order: (col: string, { ascending = true } = {}) => {
                  currentOrder = { column: col, ascending };
                  return Promise.resolve(buildResult());
                },
                lte: (col: string, val: any) => {
                  currentFilters.push({ column: col, value: val, op: "lte" });
                  return {
                    then: (callback: any) => Promise.resolve(buildResult()).then(callback),
                  };
                },
                then: (callback: any) => Promise.resolve(buildResult()).then(callback),
              };
            },
            order: (column: string, { ascending = true } = {}) => {
              currentOrder = { column, ascending };
              return {
                then: (callback: any) => Promise.resolve(buildResult()).then(callback),
              };
            },
            then: (callback: any) => Promise.resolve(buildResult()).then(callback),
          };
          return chain;
        },
        insert: (row: any | any[]) => {
          const rows = Array.isArray(row) ? row : [row];
          const newRows = rows.map((r) => ({ id: `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`, ...r, created_at: new Date().toISOString() }));
          const tableKey = currentTable as keyof MockData;

          const chain = {
            select: () => ({
              single: () => {
                if (data[tableKey]) {
                  (data[tableKey] as any[]).push(...newRows);
                }
                reset();
                return Promise.resolve({ data: newRows[0], error: null });
              },
            }),
            then: (callback: any) => {
              if (data[tableKey]) {
                (data[tableKey] as any[]).push(...newRows);
              }
              reset();
              return Promise.resolve({ data: newRows, error: null }).then(callback);
            },
          };
          return chain;
        },
        update: (patch: any) => ({
          eq: (column: string, value: any) => {
            const table = data[currentTable as keyof MockData] as any[];
            if (table) {
              const idx = table.findIndex((r) => r[column] === value);
              if (idx !== -1) {
                table[idx] = { ...table[idx], ...patch };
              }
            }
            reset();
            return Promise.resolve({ data: null, error: null });
          },
        }),
        delete: () => ({
          eq: (column: string, value: any) => {
            const tableKey = currentTable as keyof MockData;
            const table = data[tableKey] as any[];
            if (table) {
              data[tableKey] = table.filter((r) => r[column] !== value) as any;
            }
            reset();
            return Promise.resolve({ data: null, error: null });
          },
        }),
      };
    },
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    // Expose data for assertions
    _data: data,
  };
}
