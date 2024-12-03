<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div
      @click="isCollapsed = !isCollapsed"
      class="flex justify-between items-center cursor-pointer"
    >
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold">Color Analysis</h2>
        <span class="text-sm text-gray-500">
          ({{ images.length }} {{ images.length === 1 ? "image" : "images" }})
        </span>
      </div>
      <div
        class="transform transition-transform duration-200"
        :class="{ 'rotate-180': isCollapsed }"
      >
        <Icon name="heroicons:chevron-down" />
      </div>
    </div>

    <div
      v-show="!isCollapsed"
      class="transition-all duration-300 overflow-hidden"
    >
      <div class="mt-6">
        <div class="h-[300px] mb-6">
          <GroupedColorsDoughnut v-if="chartData" :chartDataProp="chartData" />
        </div>

        <div class="space-y-4">
          <div class="text-lg italic">Top colors by group</div>
          <div v-for="(group, index) in sortedGroupedColors" :key="index">
            <div class="flex justify-between text-sm mb-1">
              <span class="font-medium">{{ group.colorGroup }}</span>
              <span>{{ group.totalPercentage.toFixed(1) }}%</span>
            </div>
            <div
              class="relative"
              :style="`width: ${(group.totalPercentage / sortedGroupedColors[0].totalPercentage) * 100}%`"
            >
              <ColorPercentages :colors="group.colors" class="w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  images: {
    type: Array,
    required: true,
  },
});

const isCollapsed = ref(false);

const groupedColors = computed(() => {
  const groups = new Map();

  props.images.forEach((image) => {
    image.colors.forEach((color) => {
      const parentName = color.parent.name;
      if (!parentName) return;

      if (!groups.has(parentName)) {
        groups.set(parentName, {
          colorGroup: parentName,
          colors: [],
          totalPercentage: 0,
          hexColor: color.parent.hex,
        });
      }

      const group = groups.get(parentName);
      group.colors.push(color);
      group.totalPercentage += color.percentage / props.images.length;
    });
  });

  return Array.from(groups.values()).sort(
    (a, b) => b.totalPercentage - a.totalPercentage
  );
});

const chartData = computed(() => {
  const data = groupedColors.value;
  if (!data.length) return null;

  return {
    labels: data.map(
      (g) => `${g.colorGroup} (${g.totalPercentage.toFixed(1)}%)`
    ),
    datasets: [
      {
        data: data.map((g) => g.totalPercentage),
        backgroundColor: data.map((g) => g.hexColor),
      },
      {
        data: data.flatMap((g) => g.colors.map((c) => c.percentage)),
        backgroundColor: data.flatMap((g) => g.colors.map((c) => c.color)),
      },
    ],
  };
});

const sortedGroupedColors = computed(() => {
  return groupedColors.value;
});
</script>
