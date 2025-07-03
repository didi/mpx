<template>
  <div class="picker-view-example">
    <h1>PickerView 组件示例</h1>
    
    <!-- 基础示例 -->
    <section class="example-section">
      <h2>1. 基础使用</h2>
      <div class="example-container">
        <PickerView 
          :value="basicValue" 
          @change="onBasicChange"
          style="height: 200px;"
        >
          <PickerViewColumn>
            <div v-for="item in fruits" :key="item">{{ item }}</div>
          </PickerViewColumn>
        </PickerView>
        <p>当前选中：{{ basicValue[0] !== undefined ? fruits[basicValue[0]] : '无' }}</p>
      </div>
    </section>
    
    <!-- 多列选择器示例 -->
    <section class="example-section">
      <h2>2. 多列选择器（年月日）</h2>
      <div class="example-container">
        <PickerView 
          :value="dateValue" 
          @change="onDateChange"
          style="height: 200px;"
          indicator-style="height: 40px; background-color: rgba(0, 0, 0, 0.05);"
        >
          <PickerViewColumn>
            <div v-for="year in years" :key="year">{{ year }}年</div>
          </PickerViewColumn>
          <PickerViewColumn>
            <div v-for="month in months" :key="month">{{ month }}月</div>
          </PickerViewColumn>
          <PickerViewColumn>
            <div v-for="day in days" :key="day">{{ day }}日</div>
          </PickerViewColumn>
        </PickerView>
        <p>当前选中：{{ formatDate() }}</p>
      </div>
    </section>
    
    <!-- 城市选择器示例 -->
    <section class="example-section">
      <h2>3. 城市选择器（省市区）</h2>
      <div class="example-container">
        <PickerView 
          :value="cityValue" 
          @change="onCityChange"
          style="height: 200px;"
          indicator-class="custom-indicator"
        >
          <PickerViewColumn>
            <div v-for="province in provinces" :key="province">{{ province }}</div>
          </PickerViewColumn>
          <PickerViewColumn>
            <div v-for="city in currentCities" :key="city">{{ city }}</div>
          </PickerViewColumn>
          <PickerViewColumn>
            <div v-for="district in currentDistricts" :key="district">{{ district }}</div>
          </PickerViewColumn>
        </PickerView>
        <p>当前选中：{{ formatCity() }}</p>
      </div>
    </section>
    
    <!-- 数字选择器示例 -->
    <section class="example-section">
      <h2>4. 数字选择器</h2>
      <div class="example-container">
        <PickerView 
          :value="numberValue" 
          @change="onNumberChange"
          style="height: 200px;"
          @pickstart="onPickStart"
          @pickend="onPickEnd"
        >
          <PickerViewColumn>
            <div v-for="num in Array.from({length: 10}, (_, i) => i)" :key="num">{{ num }}</div>
          </PickerViewColumn>
          <PickerViewColumn>
            <div v-for="num in Array.from({length: 10}, (_, i) => i)" :key="num">{{ num }}</div>
          </PickerViewColumn>
        </PickerView>
        <p>当前选中：{{ numberValue[0] || 0 }}.{{ numberValue[1] || 0 }}</p>
        <p>状态：{{ isScrolling ? '滚动中' : '已停止' }}</p>
      </div>
    </section>
    
    <!-- 自定义样式示例 -->
    <section class="example-section">
      <h2>5. 自定义样式</h2>
      <div class="example-container">
        <PickerView 
          :value="customValue" 
          @change="onCustomChange"
          style="height: 200px; border: 2px solid #007AFF; border-radius: 10px;"
          indicator-style="height: 50px; background: linear-gradient(to right, #FF6B6B, #4ECDC4); border-radius: 25px;"
          mask-style="background: rgba(255, 255, 255, 0.1);"
        >
          <PickerViewColumn>
            <div v-for="color in colors" :key="color.name" :style="{ color: color.value }">
              {{ color.name }}
            </div>
          </PickerViewColumn>
        </PickerView>
        <p>当前选中：{{ customValue[0] !== undefined ? colors[customValue[0]].name : '无' }}</p>
      </div>
    </section>
    
    <!-- 控制按钮 -->
    <section class="example-section">
      <h2>6. 编程控制</h2>
      <div class="example-container">
        <div class="button-group">
          <button @click="resetBasic">重置基础选择器</button>
          <button @click="setRandomDate">随机日期</button>
          <button @click="selectBeijing">选择北京</button>
          <button @click="setRandomNumber">随机数字</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import PickerView from './PickerView.vue'
import PickerViewColumn from './PickerViewColumn.vue'

export default {
  name: 'PickerViewExample',
  components: {
    PickerView,
    PickerViewColumn
  },
  data() {
    return {
      // 基础示例数据
      basicValue: [0],
      fruits: ['苹果', '香蕉', '橙子', '葡萄', '草莓', '西瓜', '芒果', '菠萝'],
      
      // 日期选择器数据
      dateValue: [0, 0, 0],
      years: [],
      months: [],
      days: [],
      
      // 城市选择器数据
      cityValue: [0, 0, 0],
      provinces: ['北京', '上海', '广东', '浙江', '江苏'],
      citiesData: {
        '北京': ['北京市'],
        '上海': ['上海市'],
        '广东': ['广州市', '深圳市', '珠海市', '东莞市'],
        '浙江': ['杭州市', '宁波市', '温州市', '嘉兴市'],
        '江苏': ['南京市', '苏州市', '无锡市', '常州市']
      },
      districtsData: {
        '北京市': ['朝阳区', '海淀区', '西城区', '东城区'],
        '上海市': ['黄浦区', '静安区', '徐汇区', '长宁区'],
        '广州市': ['天河区', '越秀区', '荔湾区', '海珠区'],
        '深圳市': ['南山区', '福田区', '罗湖区', '宝安区'],
        '珠海市': ['香洲区', '斗门区', '金湾区'],
        '东莞市': ['莞城区', '南城区', '东城区', '万江区'],
        '杭州市': ['西湖区', '上城区', '下城区', '江干区'],
        '宁波市': ['海曙区', '江北区', '北仑区', '镇海区'],
        '温州市': ['鹿城区', '龙湾区', '瓯海区', '洞头区'],
        '嘉兴市': ['南湖区', '秀洲区', '嘉善县', '海宁市'],
        '南京市': ['玄武区', '秦淮区', '建邺区', '鼓楼区'],
        '苏州市': ['姑苏区', '虎丘区', '吴中区', '相城区'],
        '无锡市': ['梁溪区', '锡山区', '惠山区', '滨湖区'],
        '常州市': ['天宁区', '钟楼区', '新北区', '武进区']
      },
      
      // 数字选择器数据
      numberValue: [0, 0],
      isScrolling: false,
      
      // 自定义样式数据
      customValue: [0],
      colors: [
        { name: '红色', value: '#FF6B6B' },
        { name: '蓝色', value: '#4ECDC4' },
        { name: '绿色', value: '#45B7D1' },
        { name: '紫色', value: '#96CEB4' },
        { name: '橙色', value: '#FFEAA7' },
        { name: '粉色', value: '#DDA0DD' }
      ]
    }
  },
  computed: {
    currentCities() {
      const province = this.provinces[this.cityValue[0]]
      return this.citiesData[province] || []
    },
    currentDistricts() {
      const province = this.provinces[this.cityValue[0]]
      const cities = this.citiesData[province] || []
      const city = cities[this.cityValue[1]]
      return this.districtsData[city] || []
    }
  },
  created() {
    this.initDateData()
  },
  methods: {
    // 初始化日期数据
    initDateData() {
      const currentYear = new Date().getFullYear()
      this.years = Array.from({length: 100}, (_, i) => currentYear - 50 + i)
      this.months = Array.from({length: 12}, (_, i) => i + 1)
      this.days = Array.from({length: 31}, (_, i) => i + 1)
      this.dateValue = [50, 0, 0] // 默认选择当前年份
    },
    
    // 事件处理器
    onBasicChange(event) {
      console.log('基础选择器变化:', event.detail.value)
      this.basicValue = event.detail.value
    },
    
    onDateChange(event) {
      console.log('日期选择器变化:', event.detail.value)
      this.dateValue = event.detail.value
    },
    
    onCityChange(event) {
      console.log('城市选择器变化:', event.detail.value)
      const newValue = event.detail.value
      
      // 如果省份改变，重置市和区的选择
      if (newValue[0] !== this.cityValue[0]) {
        this.cityValue = [newValue[0], 0, 0]
      }
      // 如果城市改变，重置区的选择
      else if (newValue[1] !== this.cityValue[1]) {
        this.cityValue = [newValue[0], newValue[1], 0]
      }
      // 否则直接更新
      else {
        this.cityValue = newValue
      }
    },
    
    onNumberChange(event) {
      console.log('数字选择器变化:', event.detail.value)
      this.numberValue = event.detail.value
    },
    
    onCustomChange(event) {
      console.log('自定义样式选择器变化:', event.detail.value)
      this.customValue = event.detail.value
    },
    
    onPickStart(event) {
      console.log('开始滚动')
      this.isScrolling = true
    },
    
    onPickEnd(event) {
      console.log('结束滚动')
      this.isScrolling = false
    },
    
    // 格式化函数
    formatDate() {
      if (this.dateValue[0] !== undefined && this.dateValue[1] !== undefined && this.dateValue[2] !== undefined) {
        return `${this.years[this.dateValue[0]]}年${this.months[this.dateValue[1]]}月${this.days[this.dateValue[2]]}日`
      }
      return '未选择'
    },
    
    formatCity() {
      const province = this.provinces[this.cityValue[0]]
      const city = this.currentCities[this.cityValue[1]]
      const district = this.currentDistricts[this.cityValue[2]]
      return `${province || ''} ${city || ''} ${district || ''}`
    },
    
    // 控制函数
    resetBasic() {
      this.basicValue = [0]
    },
    
    setRandomDate() {
      this.dateValue = [
        Math.floor(Math.random() * this.years.length),
        Math.floor(Math.random() * this.months.length),
        Math.floor(Math.random() * this.days.length)
      ]
    },
    
    selectBeijing() {
      this.cityValue = [0, 0, 0] // 北京市朝阳区
    },
    
    setRandomNumber() {
      this.numberValue = [
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10)
      ]
    }
  }
}
</script>

<style scoped>
.picker-view-example {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.example-section {
  margin-bottom: 40px;
}

.example-section h2 {
  color: #333;
  border-bottom: 2px solid #007AFF;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.example-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background: #f9f9f9;
}

.example-container p {
  margin: 10px 0;
  font-size: 14px;
  color: #666;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.button-group button {
  padding: 8px 16px;
  border: 1px solid #007AFF;
  border-radius: 4px;
  background: white;
  color: #007AFF;
  cursor: pointer;
  transition: all 0.2s;
}

.button-group button:hover {
  background: #007AFF;
  color: white;
}

/* 自定义指示器样式 */
:deep(.custom-indicator) {
  border-top: 2px solid #007AFF;
  border-bottom: 2px solid #007AFF;
  background: rgba(0, 122, 255, 0.1);
}
</style> 