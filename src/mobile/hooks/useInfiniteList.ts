// 移动端无限滚动列表 hook，包装自 paged API
import { useCallback, useEffect, useRef, useState } from "react";
import type { ListQuery, Paged } from "@/types";

export function useInfiniteList<T>(fetcher: (q: ListQuery) => Promise<Paged<T>>, initial: ListQuery = {}) {
  const [query, setQuery] = useState<ListQuery>({ page: 1, pageSize: 15, ...initial });
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const load = useCallback(async (q: ListQuery, append: boolean) => {
    setLoading(true);
    try {
      const res = await fetcher(q);
      setTotal(res.total);
      setItems((prev) => append ? [...prev, ...res.list] : res.list);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    load(query, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFilter = (patch: Partial<ListQuery>) => {
    const next = { ...query, ...patch, page: 1 };
    setQuery(next);
    load(next, false);
  };

  const loadMore = () => {
    if (loading || items.length >= total) return;
    const next = { ...query, page: (query.page ?? 1) + 1 };
    setQuery(next);
    load(next, true);
  };

  const reload = () => load({ ...query, page: 1 }, false);

  const hasMore = items.length < total;
  return { items, total, loading, hasMore, setFilter, loadMore, reload, query };
}
