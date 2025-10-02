/**
 * 📈 Performance Chart Component
 * Mirrors: CyntientOps/Views/Admin/AdminPerformanceMetrics.swift chart functionality
 * Purpose: Advanced chart visualization for performance metrics
 * Features: Line charts, bar charts, pie charts, real-time updates, interactive tooltips
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  subtitle?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  animated?: boolean;
  interactive?: boolean;
}

export interface PerformanceChartProps {
  data: ChartDataPoint[];
  config: ChartConfig;
  onDataPointPress?: (dataPoint: ChartDataPoint, index: number) => void;
  onChartPress?: () => void;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  config,
  onDataPointPress,
  onChartPress,
}) => {
  const [selectedDataPoint, setSelectedDataPoint] = useState<ChartDataPoint | null>(null);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<ChartDataPoint | null>(null);

  const { width: screenWidth } = Dimensions.get('window');
  const chartWidth = screenWidth - (Spacing.lg * 2) - (Spacing.md * 2);
  const chartHeight = 200;

  const handleDataPointPress = useCallback((dataPoint: ChartDataPoint, index: number) => {
    setSelectedDataPoint(dataPoint);
    onDataPointPress?.(dataPoint, index);
  }, [onDataPointPress]);

  const handleDataPointHover = useCallback((dataPoint: ChartDataPoint | null) => {
    setHoveredDataPoint(dataPoint);
  }, []);

  const getMaxValue = (): number => {
    return Math.max(...data.map(d => d.y));
  };

  const getMinValue = (): number => {
    return Math.min(...data.map(d => d.y));
  };

  const getValueRange = (): number => {
    return getMaxValue() - getMinValue();
  };

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(1);
  };

  const getDataPointColor = (dataPoint: ChartDataPoint, index: number): string => {
    if (dataPoint.color) return dataPoint.color;
    
    // Generate colors based on index
    const colors = [
      Colors.base.primary,
      Colors.status.success,
      Colors.status.warning,
      Colors.status.error,
      Colors.status.info,
    ];
    return colors[index % colors.length];
  };

  const renderLineChart = () => {
    const maxValue = getMaxValue();
    const minValue = getMinValue();
    const valueRange = getValueRange();
    const stepX = chartWidth / (data.length - 1);
    const stepY = chartHeight / valueRange;

    return (
      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxisContainer}>
          {[maxValue, (maxValue + minValue) / 2, minValue].map((value, index) => (
            <Text key={index} style={styles.axisLabel}>
              {formatValue(value)}
            </Text>
          ))}
        </View>

        {/* Chart area */}
        <View style={styles.chartArea}>
          {/* Grid lines */}
          {config.showGrid && (
            <View style={styles.gridContainer}>
              {[0, 0.5, 1].map((ratio, index) => (
                <View
                  key={index}
                  style={[
                    styles.gridLine,
                    {
                      top: ratio * chartHeight,
                      backgroundColor: Colors.glass.border,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Data points and lines */}
          <View style={styles.dataContainer}>
            {data.map((dataPoint, index) => {
              const x = index * stepX;
              const y = chartHeight - ((dataPoint.y - minValue) * stepY);
              const isSelected = selectedDataPoint === dataPoint;
              const isHovered = hoveredDataPoint === dataPoint;
              const color = getDataPointColor(dataPoint, index);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dataPoint,
                    {
                      left: x - 6,
                      top: y - 6,
                      backgroundColor: color,
                      transform: [
                        { scale: isSelected ? 1.5 : isHovered ? 1.2 : 1 }
                      ],
                    },
                  ]}
                  onPress={() => handleDataPointPress(dataPoint, index)}
                  onPressIn={() => handleDataPointHover(dataPoint)}
                  onPressOut={() => handleDataPointHover(null)}
                >
                  <View style={[styles.dataPointInner, { backgroundColor: Colors.text.primary }]} />
                </TouchableOpacity>
              );
            })}

            {/* Line connecting data points */}
            <View style={styles.lineContainer}>
              {data.slice(0, -1).map((dataPoint, index) => {
                const x1 = index * stepX;
                const y1 = chartHeight - ((dataPoint.y - minValue) * stepY);
                const x2 = (index + 1) * stepX;
                const y2 = chartHeight - ((data[index + 1].y - minValue) * stepY);
                const color = getDataPointColor(dataPoint, index);

                return (
                  <View
                    key={index}
                    style={[
                      styles.lineSegment,
                      {
                        left: x1,
                        top: y1,
                        width: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
                        backgroundColor: color,
                        transform: [
                          {
                            rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad`,
                          },
                        ],
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* X-axis labels */}
        <View style={styles.xAxisContainer}>
          {data.map((dataPoint, index) => (
            <Text key={index} style={styles.axisLabel}>
              {dataPoint.label || dataPoint.x}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderBarChart = () => {
    const maxValue = getMaxValue();
    const barWidth = chartWidth / data.length * 0.8;
    const barSpacing = chartWidth / data.length * 0.2;

    return (
      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxisContainer}>
          {[maxValue, maxValue * 0.5, 0].map((value, index) => (
            <Text key={index} style={styles.axisLabel}>
              {formatValue(value)}
            </Text>
          ))}
        </View>

        {/* Chart area */}
        <View style={styles.chartArea}>
          {/* Grid lines */}
          {config.showGrid && (
            <View style={styles.gridContainer}>
              {[0, 0.5, 1].map((ratio, index) => (
                <View
                  key={index}
                  style={[
                    styles.gridLine,
                    {
                      top: ratio * chartHeight,
                      backgroundColor: Colors.glass.border,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Bars */}
          <View style={styles.barsContainer}>
            {data.map((dataPoint, index) => {
              const barHeight = (dataPoint.y / maxValue) * chartHeight;
              const x = index * (barWidth + barSpacing) + barSpacing / 2;
              const y = chartHeight - barHeight;
              const isSelected = selectedDataPoint === dataPoint;
              const color = getDataPointColor(dataPoint, index);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.bar,
                    {
                      left: x,
                      top: y,
                      width: barWidth,
                      height: barHeight,
                      backgroundColor: color,
                      transform: [
                        { scaleY: isSelected ? 1.1 : 1 }
                      ],
                    },
                  ]}
                  onPress={() => handleDataPointPress(dataPoint, index)}
                />
              );
            })}
          </View>
        </View>

        {/* X-axis labels */}
        <View style={styles.xAxisContainer}>
          {data.map((dataPoint, index) => (
            <Text key={index} style={styles.axisLabel}>
              {dataPoint.label || dataPoint.x}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderPieChart = () => {
    const total = data.reduce((sum, d) => sum + d.y, 0);
    let currentAngle = 0;

    return (
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChart}>
          {data.map((dataPoint, index) => {
            const percentage = (dataPoint.y / total) * 100;
            const angle = (dataPoint.y / total) * 360;
            const color = getDataPointColor(dataPoint, index);
            const isSelected = selectedDataPoint === dataPoint;

            const slice = (
              <View
                key={index}
                style={[
                  styles.pieSlice,
                  {
                    backgroundColor: color,
                    transform: [
                      { rotate: `${currentAngle}deg` },
                      { scale: isSelected ? 1.05 : 1 }
                    ],
                  },
                ]}
              />
            );

            currentAngle += angle;
            return slice;
          })}
        </View>

        {/* Legend */}
        {config.showLegend && (
          <View style={styles.legend}>
            {data.map((dataPoint, index) => {
              const percentage = ((dataPoint.y / total) * 100).toFixed(1);
              const color = getDataPointColor(dataPoint, index);

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.legendItem}
                  onPress={() => handleDataPointPress(dataPoint, index)}
                >
                  <View style={[styles.legendColor, { backgroundColor: color }]} />
                  <Text style={styles.legendLabel}>
                    {dataPoint.label || dataPoint.x}: {percentage}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderChart = () => {
    switch (config.type) {
      case 'line':
        return renderLineChart();
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      default:
        return renderLineChart();
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onChartPress}
      activeOpacity={config.interactive ? 0.7 : 1}
    >
      <GlassCard style={styles.chartCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        {/* Chart header */}
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <Text style={styles.chartTitle}>{config.title}</Text>
            {config.subtitle && (
              <Text style={styles.chartSubtitle}>{config.subtitle}</Text>
            )}
          </View>
          
          {config.interactive && (
            <TouchableOpacity style={styles.chartMenu}>
              <Text style={styles.chartMenuIcon}>⋯</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Chart content */}
        <View style={styles.chartContent}>
          {renderChart()}
        </View>

        {/* Chart footer */}
        <View style={styles.chartFooter}>
          {config.xAxisLabel && (
            <Text style={styles.axisLabel}>{config.xAxisLabel}</Text>
          )}
          {config.yAxisLabel && (
            <Text style={styles.axisLabel}>{config.yAxisLabel}</Text>
          )}
        </View>

        {/* Tooltip */}
        {selectedDataPoint && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipTitle}>
              {selectedDataPoint.label || selectedDataPoint.x}
            </Text>
            <Text style={styles.tooltipValue}>
              {formatValue(selectedDataPoint.y)}
            </Text>
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  chartCard: {
    padding: Spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  chartTitleContainer: {
    flex: 1,
  },
  chartTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  chartSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  chartMenu: {
    padding: Spacing.sm,
  },
  chartMenuIcon: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  chartContent: {
    minHeight: 200,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 200,
  },
  yAxisContainer: {
    width: 40,
    justifyContent: 'space-between',
    paddingRight: Spacing.sm,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  dataContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dataPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataPointInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  lineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    transformOrigin: '0 0',
  },
  barsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bar: {
    position: 'absolute',
    borderRadius: 2,
  },
  xAxisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingLeft: 40,
  },
  axisLabel: {
    ...Typography.captionSmall,
    color: Colors.text.secondary,
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  pieChart: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  pieSlice: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  legend: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  legendLabel: {
    ...Typography.caption,
    color: Colors.text.primary,
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  tooltip: {
    position: 'absolute',
    top: -50,
    left: 20,
    backgroundColor: Colors.glass.regular,
    borderRadius: 8,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  tooltipTitle: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  tooltipValue: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
});

export default PerformanceChart;

