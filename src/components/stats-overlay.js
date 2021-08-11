import React from "react";

const wrapperStyle = {
    position: "absolute",
    top: "0.5rem",
    left: "0.5rem",
    zIndex: 3,
}

/**
 * StatsOverlayCanvasWrapper
 * @param {Object} props a props object
 */
const StatsOverlayCanvasWrapper = (props) => {
    return (
        <React.Fragment>
            <a style={wrapperStyle}>FPS: {props.fps} </a>
            {props.children}
        </React.Fragment>
    )
}

export default StatsOverlayCanvasWrapper;