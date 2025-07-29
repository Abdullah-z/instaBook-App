import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Sunburst() {
  const webviewRef = useRef(null);
  const [webViewLoaded, setWebViewLoaded] = useState(false); // optional

  const chartConfig = {
    type: 'sunburst',
    width: '100%',
    height: 600,
    dataFormat: 'json',
    dataSource: {
      chart: {
        caption: 'Flare Data Store Segregation',
        subcaption: 'Click on the segments to Drill-down',
        showPlotBorder: '1',
        baseFontColor: 'ffffff',
        tooltipcolor: '000000',
        innerRadius: '70',
        theme: 'candy',
      },
      data: [
        {
          id: 1,
          name: 'analytics',
          value: 1,
        },
        {
          id: 2,
          parent: 1,
          name: 'cluster',
          value: 1,
        },
        {
          id: 3,
          parent: 2,
          name: 'AgglomerativeCluster',
          value: 3938,
        },
        {
          id: 4,
          parent: 2,
          name: 'CommunityStructure',
          value: 3812,
        },
        {
          id: 5,
          parent: 2,
          name: 'HierarchicalCluster',
          value: 6714,
        },
        {
          id: 6,
          parent: 2,
          name: 'MergeEdge',
          value: 743,
        },
        {
          id: 7,
          parent: 1,
          name: 'graph',
          value: 1,
        },
        {
          id: 8,
          parent: 7,
          name: 'BetweennessCentrality',
          value: 3534,
        },
        {
          id: 9,
          parent: 7,
          name: 'LinkDistance',
          value: 5731,
        },
        {
          id: 10,
          parent: 7,
          name: 'MaxFlowMinCut',
          value: 7840,
        },
        {
          id: 11,
          parent: 7,
          name: 'ShortestPaths',
          value: 5914,
        },
        {
          id: 12,
          parent: 7,
          name: 'SpanningTree',
          value: 3416,
        },
        {
          id: 13,
          parent: 1,
          name: 'optimization',
          value: 1,
        },
        {
          id: 14,
          parent: 13,
          name: 'AspectRatioBanker',
          value: 7074,
        },
        {
          id: 15,
          name: 'animate',
          value: 1,
        },
        {
          id: 16,
          parent: 15,
          name: 'Easing',
          value: 17010,
        },
        {
          id: 17,
          parent: 15,
          name: 'FunctionSequence',
          value: 5842,
        },
        {
          id: 18,
          parent: 15,
          name: 'interpolate',
          value: 1,
        },
        {
          id: 19,
          parent: 18,
          name: 'ArrayInterpolator',
          value: 1983,
        },
        {
          id: 20,
          parent: 18,
          name: 'ColorInterpolator',
          value: 2047,
        },
        {
          id: 21,
          parent: 18,
          name: 'DateInterpolator',
          value: 1375,
        },
        {
          id: 22,
          parent: 18,
          name: 'Interpolator',
          value: 8746,
        },
        {
          id: 23,
          parent: 18,
          name: 'MatrixInterpolator',
          value: 2202,
        },
        {
          id: 24,
          parent: 18,
          name: 'NumberInterpolator',
          value: 1382,
        },
        {
          id: 25,
          parent: 18,
          name: 'ObjectInterpolator',
          value: 1629,
        },
        {
          id: 26,
          parent: 18,
          name: 'PointInterpolator',
          value: 1675,
        },
        {
          id: 27,
          parent: 18,
          name: 'RectangleInterpolator',
          value: 2042,
        },
        {
          id: 28,
          parent: 15,
          name: 'ISchedulable',
          value: 1041,
        },
        {
          id: 29,
          parent: 15,
          name: 'Parallel',
          value: 5176,
        },
        {
          id: 30,
          parent: 15,
          name: 'Pause',
          value: 449,
        },
        {
          id: 31,
          parent: 15,
          name: 'Scheduler',
          value: 5593,
        },
        {
          id: 32,
          parent: 15,
          name: 'Sequence',
          value: 5534,
        },
        {
          id: 33,
          parent: 15,
          name: 'Transition',
          value: 9201,
        },
        {
          id: 34,
          parent: 15,
          name: 'Transitioner',
          value: 19975,
        },
        {
          id: 35,
          parent: 15,
          name: 'TransitionEvent',
          value: 1116,
        },
        {
          id: 36,
          parent: 15,
          name: 'Tween',
          value: 6006,
        },
        {
          id: 37,
          name: 'data',
          value: 1,
        },
        {
          id: 38,
          parent: 37,
          name: 'converters',
          value: 1,
        },
        {
          id: 39,
          parent: 38,
          name: 'Converters',
          value: 721,
        },
        {
          id: 40,
          parent: 38,
          name: 'DelimitedTextConverter',
          value: 4294,
        },
        {
          id: 41,
          parent: 38,
          name: 'GraphMLConverter',
          value: 9800,
        },
        {
          id: 42,
          parent: 38,
          name: 'IDataConverter',
          value: 1314,
        },
        {
          id: 43,
          parent: 38,
          name: 'JSONConverter',
          value: 2220,
        },
        {
          id: 44,
          parent: 37,
          name: 'DataField',
          value: 1759,
        },
        {
          id: 45,
          parent: 37,
          name: 'DataSchema',
          value: 2165,
        },
        {
          id: 46,
          parent: 37,
          name: 'DataSet',
          value: 586,
        },
        {
          id: 47,
          parent: 37,
          name: 'DataSource',
          value: 3331,
        },
        {
          id: 48,
          parent: 37,
          name: 'DataTable',
          value: 772,
        },
        {
          id: 49,
          parent: 37,
          name: 'DataUtil',
          value: 3322,
        },
        {
          id: 50,
          name: 'display',
          value: 1,
        },
        {
          id: 51,
          parent: 50,
          name: 'DirtySprite',
          value: 8833,
        },
        {
          id: 52,
          parent: 50,
          name: 'LineSprite',
          value: 1732,
        },
        {
          id: 53,
          parent: 50,
          name: 'RectSprite',
          value: 3623,
        },
        {
          id: 54,
          parent: 50,
          name: 'TextSprite',
          value: 10066,
        },
        {
          id: 55,
          name: 'flex',
          value: 1,
        },
        {
          id: 56,
          parent: 55,
          name: 'FlareVis',
          value: 4116,
        },
        {
          id: 57,
          name: 'physics',
          value: 1,
        },
        {
          id: 58,
          parent: 57,
          name: 'DragForce',
          value: 1082,
        },
        {
          id: 59,
          parent: 57,
          name: 'GravityForce',
          value: 1336,
        },
        {
          id: 60,
          parent: 57,
          name: 'IForce',
          value: 319,
        },
        {
          id: 61,
          parent: 57,
          name: 'NBodyForce',
          value: 10498,
        },
        {
          id: 62,
          parent: 57,
          name: 'Particle',
          value: 2822,
        },
        {
          id: 63,
          parent: 57,
          name: 'Simulation',
          value: 9983,
        },
        {
          id: 64,
          parent: 57,
          name: 'Spring',
          value: 2213,
        },
        {
          id: 65,
          parent: 57,
          name: 'SpringForce',
          value: 1681,
        },
        {
          id: 66,
          name: 'query',
          value: 1,
        },
        {
          id: 67,
          parent: 66,
          name: 'AggregateExpression',
          value: 1616,
        },
        {
          id: 68,
          parent: 66,
          name: 'And',
          value: 1027,
        },
        {
          id: 69,
          parent: 66,
          name: 'Arithmetic',
          value: 3891,
        },
        {
          id: 70,
          parent: 66,
          name: 'Average',
          value: 891,
        },
        {
          id: 71,
          parent: 66,
          name: 'BinaryExpression',
          value: 2893,
        },
        {
          id: 72,
          parent: 66,
          name: 'Comparison',
          value: 5103,
        },
        {
          id: 73,
          parent: 66,
          name: 'CompositeExpression',
          value: 3677,
        },
        {
          id: 74,
          parent: 66,
          name: 'Count',
          value: 781,
        },
        {
          id: 75,
          parent: 66,
          name: 'DateUtil',
          value: 4141,
        },
        {
          id: 76,
          parent: 66,
          name: 'Distinct',
          value: 933,
        },
        {
          id: 77,
          parent: 66,
          name: 'Expression',
          value: 5130,
        },
        {
          id: 78,
          parent: 66,
          name: 'ExpressionIterator',
          value: 3617,
        },
        {
          id: 79,
          parent: 66,
          name: 'Fn',
          value: 3240,
        },
        {
          id: 80,
          parent: 66,
          name: 'If',
          value: 2732,
        },
        {
          id: 81,
          parent: 66,
          name: 'IsA',
          value: 2039,
        },
        {
          id: 82,
          parent: 66,
          name: 'Literal',
          value: 1214,
        },
        {
          id: 83,
          parent: 66,
          name: 'Match',
          value: 3748,
        },
        {
          id: 84,
          parent: 66,
          name: 'Maximum',
          value: 843,
        },
        {
          id: 85,
          parent: 66,
          name: 'methods',
          value: 1,
        },
        {
          id: 86,
          parent: 85,
          name: 'add',
          value: 593,
        },
        {
          id: 87,
          parent: 85,
          name: 'and',
          value: 330,
        },
        {
          id: 88,
          parent: 85,
          name: 'average',
          value: 287,
        },
        {
          id: 89,
          parent: 85,
          name: 'count',
          value: 277,
        },
        {
          id: 90,
          parent: 85,
          name: 'distinct',
          value: 292,
        },
        {
          id: 91,
          parent: 85,
          name: 'div',
          value: 595,
        },
        {
          id: 92,
          parent: 85,
          name: 'eq',
          value: 594,
        },
        {
          id: 93,
          parent: 85,
          name: 'fn',
          value: 460,
        },
        {
          id: 94,
          parent: 85,
          name: 'gt',
          value: 603,
        },
        {
          id: 95,
          parent: 85,
          name: 'gte',
          value: 625,
        },
        {
          id: 96,
          parent: 85,
          name: 'iff',
          value: 748,
        },
        {
          id: 97,
          parent: 85,
          name: 'isa',
          value: 461,
        },
        {
          id: 98,
          parent: 85,
          name: 'lt',
          value: 597,
        },
        {
          id: 99,
          parent: 85,
          name: 'lte',
          value: 619,
        },
        {
          id: 100,
          parent: 85,
          name: 'max',
          value: 283,
        },
        {
          id: 101,
          parent: 85,
          name: 'min',
          value: 283,
        },
        {
          id: 102,
          parent: 85,
          name: 'mod',
          value: 591,
        },
        {
          id: 103,
          parent: 85,
          name: 'mul',
          value: 603,
        },
        {
          id: 104,
          parent: 85,
          name: 'neq',
          value: 599,
        },
        {
          id: 105,
          parent: 85,
          name: 'not',
          value: 386,
        },
        {
          id: 106,
          parent: 85,
          name: 'or',
          value: 323,
        },
        {
          id: 107,
          parent: 85,
          name: 'orderby',
          value: 307,
        },
        {
          id: 108,
          parent: 85,
          name: 'range',
          value: 772,
        },
        {
          id: 109,
          parent: 85,
          name: 'select',
          value: 296,
        },
        {
          id: 110,
          parent: 85,
          name: 'stddev',
          value: 363,
        },
        {
          id: 111,
          parent: 85,
          name: 'sub',
          value: 600,
        },
        {
          id: 112,
          parent: 85,
          name: 'sum',
          value: 280,
        },
        {
          id: 113,
          parent: 85,
          name: 'update',
          value: 307,
        },
        {
          id: 114,
          parent: 85,
          name: 'variance',
          value: 335,
        },
        {
          id: 115,
          parent: 85,
          name: 'where',
          value: 299,
        },
        {
          id: 116,
          parent: 85,
          name: 'xor',
          value: 354,
        },
        {
          id: 117,
          parent: 85,
          name: '_',
          value: 264,
        },
        {
          id: 118,
          parent: 66,
          name: 'Minimum',
          value: 843,
        },
        {
          id: 119,
          parent: 66,
          name: 'Not',
          value: 1554,
        },
        {
          id: 120,
          parent: 66,
          name: 'Or',
          value: 970,
        },
        {
          id: 121,
          parent: 66,
          name: 'Query',
          value: 13896,
        },
        {
          id: 122,
          parent: 66,
          name: 'Range',
          value: 1594,
        },
        {
          id: 123,
          parent: 66,
          name: 'StringUtil',
          value: 4130,
        },
        {
          id: 124,
          parent: 66,
          name: 'Sum',
          value: 791,
        },
        {
          id: 125,
          parent: 66,
          name: 'Variable',
          value: 1124,
        },
        {
          id: 126,
          parent: 66,
          name: 'Variance',
          value: 1876,
        },
        {
          id: 127,
          parent: 66,
          name: 'Xor',
          value: 1101,
        },
        {
          id: 128,
          name: 'scale',
          value: 1,
        },
        {
          id: 129,
          parent: 128,
          name: 'IScaleMap',
          value: 2105,
        },
        {
          id: 130,
          parent: 128,
          name: 'LinearScale',
          value: 1316,
        },
        {
          id: 131,
          parent: 128,
          name: 'LogScale',
          value: 3151,
        },
        {
          id: 132,
          parent: 128,
          name: 'OrdinalScale',
          value: 3770,
        },
        {
          id: 133,
          parent: 128,
          name: 'QuantileScale',
          value: 2435,
        },
        {
          id: 134,
          parent: 128,
          name: 'QuantitativeScale',
          value: 4839,
        },
        {
          id: 135,
          parent: 128,
          name: 'RootScale',
          value: 1756,
        },
        {
          id: 136,
          parent: 128,
          name: 'Scale',
          value: 4268,
        },
        {
          id: 137,
          parent: 128,
          name: 'ScaleType',
          value: 1821,
        },
        {
          id: 138,
          parent: 128,
          name: 'TimeScale',
          value: 5833,
        },
        {
          id: 139,
          name: 'util',
          value: 1,
        },
        {
          id: 140,
          parent: 139,
          name: 'Arrays',
          value: 8258,
        },
        {
          id: 141,
          parent: 139,
          name: 'Colors',
          value: 10001,
        },
        {
          id: 142,
          parent: 139,
          name: 'Dates',
          value: 8217,
        },
        {
          id: 143,
          parent: 139,
          name: 'Displays',
          value: 12555,
        },
        {
          id: 144,
          parent: 139,
          name: 'Filter',
          value: 2324,
        },
        {
          id: 145,
          parent: 139,
          name: 'Geometry',
          value: 10993,
        },
        {
          id: 146,
          parent: 139,
          name: 'heap',
          value: 1,
        },
        {
          id: 147,
          parent: 146,
          name: 'FibonacciHeap',
          value: 9354,
        },
        {
          id: 148,
          parent: 146,
          name: 'HeapNode',
          value: 1233,
        },
        {
          id: 149,
          parent: 139,
          name: 'IEvaluable',
          value: 335,
        },
        {
          id: 150,
          parent: 139,
          name: 'IPredicate',
          value: 383,
        },
        {
          id: 151,
          parent: 139,
          name: 'IValueProxy',
          value: 874,
        },
        {
          id: 152,
          parent: 139,
          name: 'math',
          value: 1,
        },
        {
          id: 153,
          parent: 152,
          name: 'DenseMatrix',
          value: 3165,
        },
        {
          id: 154,
          parent: 152,
          name: 'IMatrix',
          value: 2815,
        },
        {
          id: 155,
          parent: 152,
          name: 'SparseMatrix',
          value: 3366,
        },
        {
          id: 156,
          parent: 139,
          name: 'Maths',
          value: 17705,
        },
        {
          id: 157,
          parent: 139,
          name: 'Orientation',
          value: 1486,
        },
        {
          id: 158,
          parent: 139,
          name: 'palette',
          value: 1,
        },
        {
          id: 159,
          parent: 158,
          name: 'ColorPalette',
          value: 6367,
        },
        {
          id: 160,
          parent: 158,
          name: 'Palette',
          value: 1229,
        },
        {
          id: 161,
          parent: 158,
          name: 'ShapePalette',
          value: 2059,
        },
        {
          id: 162,
          parent: 158,
          name: 'SizePalette',
          value: 2291,
        },
        {
          id: 163,
          parent: 139,
          name: 'Property',
          value: 5559,
        },
        {
          id: 164,
          parent: 139,
          name: 'Shapes',
          value: 19118,
        },
        {
          id: 165,
          parent: 139,
          name: 'Sort',
          value: 6887,
        },
        {
          id: 166,
          parent: 139,
          name: 'Stats',
          value: 6557,
        },
        {
          id: 167,
          parent: 139,
          name: 'Strings',
          value: 22026,
        },
        {
          id: 168,
          name: 'vis',
          value: 1,
        },
        {
          id: 169,
          parent: 168,
          name: 'axis',
          value: 1,
        },
        {
          id: 170,
          parent: 169,
          name: 'Axes',
          value: 1302,
        },
        {
          id: 171,
          parent: 169,
          name: 'Axis',
          value: 24593,
        },
        {
          id: 172,
          parent: 169,
          name: 'AxisGridLine',
          value: 652,
        },
        {
          id: 173,
          parent: 169,
          name: 'AxisLabel',
          value: 636,
        },
        {
          id: 174,
          parent: 169,
          name: 'CartesianAxes',
          value: 6703,
        },
        {
          id: 175,
          parent: 168,
          name: 'controls',
          value: 1,
        },
        {
          id: 176,
          parent: 175,
          name: 'AnchorControl',
          value: 2138,
        },
        {
          id: 177,
          parent: 175,
          name: 'ClickControl',
          value: 3824,
        },
        {
          id: 178,
          parent: 175,
          name: 'Control',
          value: 1353,
        },
        {
          id: 179,
          parent: 175,
          name: 'ControlList',
          value: 4665,
        },
        {
          id: 180,
          parent: 175,
          name: 'DragControl',
          value: 2649,
        },
        {
          id: 181,
          parent: 175,
          name: 'ExpandControl',
          value: 2832,
        },
        {
          id: 182,
          parent: 175,
          name: 'HoverControl',
          value: 4896,
        },
        {
          id: 183,
          parent: 175,
          name: 'IControl',
          value: 763,
        },
        {
          id: 184,
          parent: 175,
          name: 'PanZoomControl',
          value: 5222,
        },
        {
          id: 185,
          parent: 175,
          name: 'SelectionControl',
          value: 7862,
        },
        {
          id: 186,
          parent: 175,
          name: 'TooltipControl',
          value: 8435,
        },
        {
          id: 187,
          parent: 168,
          name: 'data',
          value: 1,
        },
        {
          id: 188,
          parent: 187,
          name: 'Data',
          value: 20544,
        },
        {
          id: 189,
          parent: 187,
          name: 'DataList',
          value: 19788,
        },
        {
          id: 190,
          parent: 187,
          name: 'DataSprite',
          value: 10349,
        },
        {
          id: 191,
          parent: 187,
          name: 'EdgeSprite',
          value: 3301,
        },
        {
          id: 192,
          parent: 187,
          name: 'NodeSprite',
          value: 19382,
        },
        {
          id: 193,
          parent: 187,
          name: 'render',
          value: 1,
        },
        {
          id: 194,
          parent: 193,
          name: 'ArrowType',
          value: 698,
        },
        {
          id: 195,
          parent: 193,
          name: 'EdgeRenderer',
          value: 5569,
        },
        {
          id: 196,
          parent: 193,
          name: 'IRenderer',
          value: 353,
        },
        {
          id: 197,
          parent: 193,
          name: 'ShapeRenderer',
          value: 2247,
        },
        {
          id: 198,
          parent: 187,
          name: 'ScaleBinding',
          value: 11275,
        },
        {
          id: 199,
          parent: 187,
          name: 'Tree',
          value: 7147,
        },
        {
          id: 200,
          parent: 187,
          name: 'TreeBuilder',
          value: 9930,
        },
        {
          id: 201,
          parent: 168,
          name: 'events',
          value: 1,
        },
        {
          id: 202,
          parent: 201,
          name: 'DataEvent',
          value: 2313,
        },
        {
          id: 203,
          parent: 201,
          name: 'SelectionEvent',
          value: 1880,
        },
        {
          id: 204,
          parent: 201,
          name: 'TooltipEvent',
          value: 1701,
        },
        {
          id: 205,
          parent: 201,
          name: 'VisualizationEvent',
          value: 1117,
        },
        {
          id: 206,
          parent: 168,
          name: 'legend',
          value: 1,
        },
        {
          id: 207,
          parent: 206,
          name: 'Legend',
          value: 20859,
        },
        {
          id: 208,
          parent: 206,
          name: 'LegendItem',
          value: 4614,
        },
        {
          id: 209,
          parent: 206,
          name: 'LegendRange',
          value: 10530,
        },
        {
          id: 210,
          parent: 168,
          name: 'operator',
          value: 1,
        },
        {
          id: 211,
          parent: 210,
          name: 'distortion',
          value: 1,
        },
        {
          id: 212,
          parent: 211,
          name: 'BifocalDistortion',
          value: 4461,
        },
        {
          id: 213,
          parent: 211,
          name: 'Distortion',
          value: 6314,
        },
        {
          id: 214,
          parent: 211,
          name: 'FisheyeDistortion',
          value: 3444,
        },
        {
          id: 215,
          parent: 210,
          name: 'encoder',
          value: 1,
        },
        {
          id: 216,
          parent: 215,
          name: 'ColorEncoder',
          value: 3179,
        },
        {
          id: 217,
          parent: 215,
          name: 'Encoder',
          value: 4060,
        },
        {
          id: 218,
          parent: 215,
          name: 'PropertyEncoder',
          value: 4138,
        },
        {
          id: 219,
          parent: 215,
          name: 'ShapeEncoder',
          value: 1690,
        },
        {
          id: 220,
          parent: 215,
          name: 'SizeEncoder',
          value: 1830,
        },
        {
          id: 221,
          parent: 210,
          name: 'filter',
          value: 1,
        },
        {
          id: 222,
          parent: 221,
          name: 'FisheyeTreeFilter',
          value: 5219,
        },
        {
          id: 223,
          parent: 221,
          name: 'GraphDistanceFilter',
          value: 3165,
        },
        {
          id: 224,
          parent: 221,
          name: 'VisibilityFilter',
          value: 3509,
        },
        {
          id: 225,
          parent: 210,
          name: 'IOperator',
          value: 1286,
        },
        {
          id: 226,
          parent: 210,
          name: 'label',
          value: 1,
        },
        {
          id: 227,
          parent: 226,
          name: 'Labeler',
          value: 9956,
        },
        {
          id: 228,
          parent: 226,
          name: 'RadialLabeler',
          value: 3899,
        },
        {
          id: 229,
          parent: 226,
          name: 'StackedAreaLabeler',
          value: 3202,
        },
        {
          id: 230,
          parent: 210,
          name: 'layout',
          value: 1,
        },
        {
          id: 231,
          parent: 230,
          name: 'AxisLayout',
          value: 6725,
        },
        {
          id: 232,
          parent: 230,
          name: 'BundledEdgeRouter',
          value: 3727,
        },
        {
          id: 233,
          parent: 230,
          name: 'CircleLayout',
          value: 9317,
        },
        {
          id: 234,
          parent: 230,
          name: 'CirclePackingLayout',
          value: 12003,
        },
        {
          id: 235,
          parent: 230,
          name: 'DendrogramLayout',
          value: 4853,
        },
        {
          id: 236,
          parent: 230,
          name: 'ForceDirectedLayout',
          value: 8411,
        },
        {
          id: 237,
          parent: 230,
          name: 'IcicleTreeLayout',
          value: 4864,
        },
        {
          id: 238,
          parent: 230,
          name: 'IndentedTreeLayout',
          value: 3174,
        },
        {
          id: 239,
          parent: 230,
          name: 'Layout',
          value: 7881,
        },
        {
          id: 240,
          parent: 230,
          name: 'NodeLinkTreeLayout',
          value: 12870,
        },
        {
          id: 241,
          parent: 230,
          name: 'PieLayout',
          value: 2728,
        },
        {
          id: 242,
          parent: 230,
          name: 'RadialTreeLayout',
          value: 12348,
        },
        {
          id: 243,
          parent: 230,
          name: 'RandomLayout',
          value: 870,
        },
        {
          id: 244,
          parent: 230,
          name: 'StackedAreaLayout',
          value: 9121,
        },
        {
          id: 245,
          parent: 230,
          name: 'TreeMapLayout',
          value: 9191,
        },
        {
          id: 246,
          parent: 210,
          name: 'Operator',
          value: 2490,
        },
        {
          id: 247,
          parent: 210,
          name: 'OperatorList',
          value: 5248,
        },
        {
          id: 248,
          parent: 210,
          name: 'OperatorSequence',
          value: 4190,
        },
        {
          id: 249,
          parent: 210,
          name: 'OperatorSwitch',
          value: 2581,
        },
        {
          id: 250,
          parent: 210,
          name: 'SortOperator',
          value: 2023,
        },
        {
          id: 251,
          parent: 168,
          name: 'Visualization',
          value: 16540,
        },
      ],
    },
  };

  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      <script src="https://cdn.fusioncharts.com/fusioncharts/latest/fusioncharts.js"></script>
      <script src="https://cdn.fusioncharts.com/fusioncharts/latest/fusioncharts.powercharts.js"></script>
      <script src="https://cdn.fusioncharts.com/fusioncharts/latest/themes/fusioncharts.theme.fusion.js"></script>
       <style>
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: transparent;
          }
          #chart-container {
            height: 600px; /* ✅ Matches View and FusionChart height */
            width: 100%;
          }
        </style>
      </head>
      <body>
        <div id="chart-container">Loading chart…</div>
        <script>
          document.addEventListener('message', function (e) {
            try {
              const { chartConfig } = JSON.parse(e.data);
              new FusionCharts({ ...chartConfig, renderAt: 'chart-container' }).render();
            } catch (err) {
              document.getElementById('chart-container').innerText = 'Chart Error: ' + err.message;
            }
          });

          window.addEventListener('message', function (e) {
            try {
              const { chartConfig } = JSON.parse(e.data);
              new FusionCharts({ ...chartConfig, renderAt: 'chart-container' }).render();
            } catch (err) {
              document.getElementById('chart-container').innerText = 'Chart Error: ' + err.message;
            }
          });
        </script>
      </body>
    </html>
  `;

  const sendChartConfig = () => {
    if (webviewRef.current) {
      webviewRef.current.postMessage(JSON.stringify({ chartConfig }));
    }
  };

  return (
    <View style={{ height: 600, width: '100%' }}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        source={{ html: htmlContent }}
        scrollEnabled={false}
        nestedScrollEnabled={false}
        overScrollMode="never"
        setSupportZoom={false}
        onLoadEnd={() => {
          setWebViewLoaded(true); // optional
          setTimeout(sendChartConfig, 100); // critical timing fix
        }}
      />
    </View>
  );
}
