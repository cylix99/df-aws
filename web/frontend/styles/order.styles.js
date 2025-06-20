export const styles = {
  stickyProgressContainer: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    backgroundColor: "var(--p-surface)", // using Polaris token
    padding: "var(--p-space-4)",
    borderBottom: "1px solid var(--p-border-subdued)",
  },
  progressText: {
    marginBottom: "var(--p-space-2)",
    fontWeight: 500,
    color: "var(--p-text-subdued)",
  },
  contentContainer: {
    padding: "var(--p-space-4)",
    background: "var(--p-background)",
    borderRadius: "var(--p-border-radius)",
  },
  badge: {
    marginLeft: "var(--p-space-2)",
  },
  filterBar: {
    padding: "var(--p-space-4)",
    borderBottom: "1px solid var(--p-border-subdued)",
  },
  summaryCard: {
    position: "sticky",
    top: "var(--p-space-4)",
    boxShadow: "var(--p-shadow-medium)",
  },
  actionGroup: {
    gap: "var(--p-space-2)",
  },
};
