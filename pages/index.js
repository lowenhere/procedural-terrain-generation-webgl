import Head from 'next/head';
import React from "react";
import { useEffect, useRef, useState } from "react";
import _ from "lodash";

import glReset from "gl-reset";
import Drawer from '@material-ui/core/Drawer';

import { Initialise } from "../webgl/procedural-terrain"
import styles from '../styles/Home.module.css'
import { Container, Button, IconButton, Typography, Slider, TextField, Switch } from '@material-ui/core';
import { Menu, ChevronLeft, ChevronRight } from '@material-ui/icons';

const paramInputs = [
  //========================================================================
  //
  //                            GENERATION CONTROLS                             
  //
  //========================================================================
  {
    name: 'Generation',
    type: 'header'
  },
  {
    name: "seed",
    key: "seed",
    group: 'perlin',
    type: "textfield",
    props: {
      defaultValue: "",
    }
  },  
  {
    name: "size",
    key: "size",
    group: 'generation',
    type: "slider",
    props: {
      min: 10,
      max: 60,
      step: 1,
      marks: true,
    }
  },
  //========================================================================
  //
  //                            PERLIN CONTROLS                             
  //
  //========================================================================
  {
    name: 'Perlin',
    type: 'header'
  },
  {
    name: "octaves",
    key: "octaves",
    group: 'perlin',
    type: "slider",
    props: {
      min: 1,
      max: 10,
      step: 1,
      marks: true,
    }
  },
  {
    name: "persistence",
    key: "persistence",
    group: 'perlin',
    type: "slider",
    props: {
      min: 0,
      max: 1,
      step: 0.1,
      marks: true,
    }
  },
  {
    name: "lacunarity",
    key: "lacunarity",
    group: 'perlin',
    type: "slider",
    props: {
      min: 1.0,
      max: 5.0,
      step: 0.1,
      marks: false,
    }
  },
  {
    name: "perlin scale",
    key: "perlinScale",
    group: 'perlin',
    type: "slider",
    props: {
      min: 0.1,
      max: 20,
      step: 0.5,
    }
  },
  {
    name: "height scale",
    key: "heightScale",
    group: 'perlin',
    type: "slider",
    props: {
      min: 0.1,
      max: 14,
      step: 0.5,
    }
  },
  //========================================================================
  //
  //                            TERRAIN TYPE CONTROLS                             
  //
  //========================================================================
  {
    name: 'Terrain Types',
    type: 'header'
  },
  {
    name: "mountain height",
    key: "MOUNTAIN",
    group: 'terrain',
    type: "slider",
    props: {
      min: -1,
      max: 1,
      step: 0.1,
    }
  },
  {
    name: "grass height",
    key: "GRASS",
    group: 'terrain',
    type: "slider",
    props: {
      min: -1,
      max: 1,
      step: 0.1,
    }
  },
  {
    name: "sand height",
    key: "SAND",
    group: 'terrain',
    type: "slider",
    props: {
      min: -1,
      max: 1,
      step: 0.1,
    }
  },
  {
    name: "water height",
    key: "WATER",
    group: 'terrain',
    type: "slider",
    props: {
      min: -1,
      max: 1,
      step: 0.1,
    }
  },
  //========================================================================
  //
  //                            WATER CONTROLS                             
  //
  //========================================================================
  {
    name: 'Water',
    type: 'header'
  },
  {
    name: "water amplitude",
    key: "maxVertexOscillation",
    group: 'water',
    type: "slider",
    props: {
      min: 0,
      max: 0.4,
      step: 0.05,
    }
  },
  {
    name: "water oscillation hor scale",
    key: "oscillationScale",
    group: 'water',
    type: "slider",
    props: {
      min: 300,
      max: 600,
      step: 50,
    }
  },
  {
    name: "water distortion",
    key: "distortionEnabled",
    group: 'water',
    type: "switch",
  },
  {
    name: "water distortion strength",
    key: "distortionStrength",
    group: 'water',
    type: "slider",
    props: {
      min: 0,
      max: 0.02,
      step: 0.005,
    }
  },
  {
    name: "water distortion tiling",
    key: "dudvTiling",
    group: 'water',
    type: "slider",
    props: {
      min: 0.1,
      max: 0.9,
      step: 0.1,
    }
  },
  {
    name: "water shininess dampening",
    key: "shininessDampening",
    group: 'water',
    type: "slider",
    props: {
      min: 1,
      max: 10,
      step: 1,
    }
  },
  {
    name: "water specular reflectivity",
    key: "specularReflectivity",
    group: 'water',
    type: "slider",
    props: {
      min: 0.1,
      max: 1.0,
      step: 0.1,
    }
  },
  //========================================================================
  //
  //                            TREES AND ROCKS CONTROLS                             
  //
  //========================================================================
  {
    name: 'Procedural Objects',
    type: 'header'
  },
  {
    name: "tree probability",
    key: "treeProbability",
    group: 'proceduralObjects',
    type: "slider",
    props: {
      min: 0,
      max: 0.2,
      step: 0.01,
    }
  },
  {
    name: "rock probability",
    key: "rockProbability",
    group: 'proceduralObjects',
    type: "slider",
    props: {
      min: 0,
      max: 0.2,
      step: 0.01,
    }
  },
]


export default function Home() {
  // scene-related hooks
  const canvasRef = useRef();
  const scene = useRef({
    controls: {
      startLoop: () => { },
      stopLoop: () => { }
    }
  });

  const [sceneParams, setSceneParams] = useState({
    generation: {
      size: 40
    },
    perlin: {
      octaves: 6,
      lacunarity: 4,
      persistence: 0.4,
      perlinScale: 20.0,
      heightScale: 7.4,
      seed: '',
      normalizeGrad: true,
    },
    terrain: {
      WATER: -0.4,
      SAND: -0.3,
      GRASS: -0.1,
      MOUNTAIN: 0.5,
    },
    water: {
      maxVertexOscillation: 0.05,
      distortionEnabled: true,
      distortionStrength: 0.01,
      shininessDampening: 2.0,
      specularReflectivity: 0.8,
      maxVertexOscillation: 0.05,
      dudvTiling: 0.2,
      oscillationScale: 500.0,
    }, 
    proceduralObjects: {
      treeProbability: 0.05,
      rockProbability: 0.05,
    }
  });


  function createOnParamChange(item) {    
    return (event, value)=>{
      let newValue = item.type == 'slider' ? value : item.type == 'switch' ? event.target.checked : event.target.value;

      setSceneParams({...sceneParams, [item.group]: {...sceneParams[item.group], [item.key]: newValue}});
    };
  }


  // hooks for metrics reporting
  const [metrics, setSceneMetrics] = useState({
    fps: 0,
  });

  // report fps based on average of the last 10 frames
  let prevTime = performance.now();
  let frameCounter = 0;
  // callback passed to loop, call on each loop to get the frame rate
  const reportTimeCallback = (currentFrameTime) => {
    if (frameCounter < 5) {
      frameCounter++;
      return;
    }

    const deltaFrameTime = currentFrameTime - prevTime;
    const fps = Math.round(5 * (1000 / deltaFrameTime));

    setSceneMetrics({
      ...metrics,
      fps,
    });

    prevTime = currentFrameTime;
    frameCounter = 0;
  }

  // on component mount
  useEffect(() => {

  }, [])

  // on sceneParams change (will be called once on mount)
  useEffect(() => {
    // reset gl context
    const gl = canvasRef.current.getContext('webgl2');
    glReset(gl);

    // re-initialize, set new scene controls and start scene
    scene.current.controls.stopLoop(); //kill old loop
    scene.current.controls = Initialise(gl, canvasRef.current, sceneParams, reportTimeCallback);
    scene.current.controls.startLoop();
  }, [sceneParams]);

  // ui-related hooks
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleDrawerOpen = () => { setDrawerOpen(true) };
  const handleDrawerClose = () => { setDrawerOpen(false) };

  const drawerItems = paramInputs.map((item, i) => {
    if (item.type == "slider") {
      return (
        <div key={`${i}`} style={{marginBottom: 4}}>
          <Typography>{item.name}: {sceneParams[item.group][item.key]}</Typography>
          <Slider {...item.props} value={sceneParams[item.group][item.key]} onChange={createOnParamChange(item)} />
        </div>
      )
    }

    if (item.type == "textfield") {
      return (
        <div key={`${i}`} style={{marginBottom: 4}}>
          <Typography>{item.name}</Typography>
          <TextField {...item.props} defaultValue={sceneParams[item.group][item.key]} onChange={createOnParamChange(item)}/>
        </div>
      )
    }

    if (item.type == "switch") {
      return (
        <div key={`${i}`} style={{marginBottom: 4}}>
          <Typography>{item.name}</Typography>
          <Switch   {...item.props} color='primary' checked={sceneParams[item.group][item.key]} onChange={createOnParamChange(item)}/>
        </div>
      )
    }
  
    if (item.type == "header") {
      return (
        <div key={`${i}`} style={{marginBottom: 4}}>
          <Typography style={{fontSize: '1.3rem',fontWeight: 'bold'}} color='primary'>{item.name}</Typography>
        </div>
      )
    }

  })

  return (
    <div className={styles.container}>
      <Head>
        <title>Procedural Terrain Generation</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <Container disableGutters={true} maxWidth={false}>
          <Drawer
            variant="persistent"
            anchor="left"
            open={drawerOpen}
          >
            <Container style={{ width: "300px" }}>
              <IconButton style={{marginLeft: -20}} onClick={handleDrawerClose}>
                <ChevronLeft />
              </IconButton>

              {drawerItems}
            </Container>
          </Drawer>


          <IconButton
            style={{ position: "absolute", top: "0.5rem", left: "0.5rem", zIndex: 10 }}
            onClick={handleDrawerOpen}
          >
            <Menu />
          </IconButton>
          <a style={{ position: "absolute", top: "0.5rem", right: "0.5rem", zIndex: 10 }}>FPS: {metrics.fps}</a>
          <canvas width="720" height="480" ref={canvasRef}></canvas>
        </Container>
        <div style={{position: 'absolute', bottom: 12, left: 12, display: 'flex', flexDirection: 'column'}}>
          <Typography color='primary'>WASD: move </Typography>
          <Typography color='primary'>Q: up</Typography>
          <Typography color='primary'>E: down</Typography>
          <Typography color='primary'>Space: move faster</Typography>
          <Typography color='primary'>Left click to enter/exit FPS mode</Typography>

        </div>
      </main>
    </div>
  )
}
