import ReactECharts from 'echarts-for-react'

export default function ProgressChart({ data, mode = 'byCount' }) {
  const activeData = mode === 'byDate' && data?.byDate ? data.byDate : data

  if (!activeData || !activeData.dates || activeData.dates.length === 0) {
    return <div className="text-center text-gray-400 py-8">暂无进步数据</div>
  }

  const option = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['技术知识', '逻辑思维', '表达能力', '综合得分'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: activeData.dates,
      axisLabel: {
        color: '#6b7280',
        fontSize: 11,
        rotate: activeData.dates.length > 5 ? 30 : 0,
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        color: '#6b7280',
      },
    },
    series: [
      {
        name: '技术知识',
        type: 'line',
        smooth: true,
        data: activeData.technicalScores,
        lineStyle: { color: '#3b82f6' },
        itemStyle: { color: '#3b82f6' },
      },
      {
        name: '逻辑思维',
        type: 'line',
        smooth: true,
        data: activeData.logicScores,
        lineStyle: { color: '#10b981' },
        itemStyle: { color: '#10b981' },
      },
      {
        name: '表达能力',
        type: 'line',
        smooth: true,
        data: activeData.expressionScores,
        lineStyle: { color: '#f59e0b' },
        itemStyle: { color: '#f59e0b' },
      },
      {
        name: '综合得分',
        type: 'line',
        smooth: true,
        data: activeData.overallScores,
        lineStyle: { color: '#8b5cf6', width: 3 },
        itemStyle: { color: '#8b5cf6' },
      },
    ],
  }

  return (
    <ReactECharts
      option={option}
      style={{ height: 300, width: '100%' }}
      opts={{ renderer: 'svg' }}
      key={mode}
    />
  )
}
