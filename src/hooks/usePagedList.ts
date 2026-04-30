import { useEffect, useState, useCallback } from "react";
import type { ListQuery, Paged } from "@/types";

export function usePagedList<T>(fetcher: (q: ListQuery) => Promise<Paged<T>>, initial: ListQuery = {}) {
  const [query, setQuery] = useState<ListQuery>({ page: 1, pageSize: 10, ...initial });
  const [data, setData] = useState<Paged<T>>({ list: [], total: 0, page: 1, pageSize: 10 });
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async (q?: ListQuery) => {
    setLoading(true);
    const next = { ...query, ...q };
    setQuery(next);
    try {
      const res = await fetcher(next);
      setData(res);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, JSON.stringify(query)]);

  useEffect(() => {
    setLoading(true);
    fetcher(query).then((res) => { setData(res); setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFilter = (patch: Partial<ListQuery>) => reload({ ...patch, page: 1 });
  const setPage = (page: number) => reload({ page });

  return { query, data, loading, reload, setFilter, setPage };
}
