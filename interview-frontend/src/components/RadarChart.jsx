import ReactECharts from 'echarts-for-react'

export default function RadarChart({ data }) {
  if (!data || !data.dimensions || !data.scores) {
    return <div className="text-center text-gray-400 py-8">暂无雷达图数据</div>
  }

  const option = {
    tooltip: {
      trigger: 'item',
    },
    radar: {
      indicator: data.dimensions.map((dim, i) => ({
        name: dim,
        max: 100,
      })),
      radius: '65%',
      axisName: {
        color: '#6b7280',
        fontSize: 13,
      },
      splitArea: {
        areaStyle: {
          color: ['#f8fafc', '#f1f5f9', '#e2e8f0', '#dbeafe', '#eff6ff'],
        },
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: data.scores,
            name: '你的得分',
            areaStyle: {
              color: 'rgba(59, 130, 246, 0.2)',
            },
            lineStyle: {
              color: '#3b82f6',
              width: 2,
            },
            itemStyle: {
              color: '#3b82f6',
            },
          },
          {
            value: data.industryAverage || [75, 78, 72, 65, 80],
            name: '行业平均',
            lineStyle: {
              color: '#9ca3af',
              type: 'dashed',
              width: 1,
            },
            itemStyle: {
              color: '#9ca3af',
            },
            symbol: 'none',
          },
        ],
      },
    ],
    legend: {
      bottom: 0,
      data: ['你的得分', '行业平均'],
    },
  }

  return (
    <ReactECharts
      option={option}
      style={{ height: 350, width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  )
}
