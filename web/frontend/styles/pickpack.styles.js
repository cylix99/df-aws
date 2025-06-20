export const styles = {
  stack: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "stretch",
    padding: "1rem 0",
  },
  stackItem: {
    maxWidth: "100%",
    flex: "1",
    minWidth: 0,
    padding: "2rem",
  },
  stackPick: {
    maxWidth: "10%",
  },
  qty: {
    alignItems: "center",
    padding: "2rem 0rem",
    textAlign: "center",
  },
  pick: {
    fontSize: "1.4rem",
    fontWeight: 600,
    lineHeight: "2.4rem",
    margin: 0,
  },
  pickNo: {
    fontSize: "1.4rem",
    fontWeight: 600,
    margin: "0 0 20px 0",
  },
  thumbnail: {
    width: "16rem",
    position: "relative",
    display: "block",
    overflow: "hidden",
    minWidth: "4rem",
    maxWidth: "30%",
  },
  lowerPad: {
    padding: "0.5rem 0 0 0",
  },
  img: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    margin: "auto",
    maxWidth: "100%",
    maxHeight: "100%",
  },
  stickyProgressContainer: {
    position: "fixed",
    bottom: 0, // Changed from top: 0
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "white",
    padding: "1rem",
    borderTop: "1px solid #ddd", // Changed from borderBottom
    boxShadow: "0 -2px 5px rgba(0,0,0,0.1)", // Added shadow on top
  },
  contentContainer: {
    marginTop: "0", // Removed top margin
    marginBottom: "80px", // Added bottom margin to prevent content from being hidden behind progress bar
  },
  sticky: {
    zIndex: 9999,
    position: "sticky",
    top: 0,
    backgroundColor: "#fff",
  },
  hr: {
    borderBottom: "0.1rem solid #ccc",
  },
  separatorStyle: {
    margin: "0 5px",
    color: "#999",
  },
  flexItemStyle: {
    flexGrow: 1,
    textAlign: "center",
  },
  progressContainer: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: "1rem",
    zIndex: 100,
    borderBottom: "1px solid #dfe3e8",
  },
  progressText: {
    marginBottom: "0.5rem",
  },
};
