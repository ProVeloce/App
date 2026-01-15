/**
 * Recharts Wrapper Component
 * This file exists to fix the "Cannot access 'S' before initialization" error
 * that occurs with Recharts and Vite due to circular dependencies in the library.
 * By isolating the Recharts imports in a separate file, we avoid the bundling issue.
 */

export {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    ComposedChart,
    Scatter,
    ScatterChart,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    RadialBarChart,
    RadialBar,
    Treemap,
    Funnel,
    FunnelChart
} from 'recharts';
