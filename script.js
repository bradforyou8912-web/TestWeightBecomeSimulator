document.addEventListener('DOMContentLoaded', function() {
    // 우측 입력 요소들
    const weightText = document.getElementById('weightText');
    const weightSlider = document.getElementById('weightSlider');
    const ageText = document.getElementById('ageText');
    const ageSlider = document.getElementById('ageSlider');
    const heightText = document.getElementById('heightText');
    const heightSlider = document.getElementById('heightSlider');
    const gender = document.getElementById('gender');
    const caloriesText = document.getElementById('caloriesText');
    const caloriesSlider = document.getElementById('caloriesSlider');
    const exerciseTimeText = document.getElementById('exerciseTimeText');
    const exerciseTimeSlider = document.getElementById('exerciseTimeSlider');
    const intensityText = document.getElementById('intensityText');
    const intensitySlider = document.getElementById('intensitySlider');

    // 좌측 요소들
    const daysSlider = document.getElementById('daysSlider');
    const daysValue = document.getElementById('daysValue');
    const resetButton = document.getElementById('resetButton');
    const personSvg = document.getElementById('personSvg');
    const calculatedWeightDisplay = document.getElementById('calculatedWeightDisplay');
    const relationshipDisplay = document.getElementById('relationshipDisplay');
    const warningMessage = document.getElementById('warningMessage');

    const MIN_WEIGHT = 30;
    const MAX_WEIGHT = 150;

    // 슬라이더와 텍스트 동기화 함수
    function syncSliderText(slider, text) {
        const updateValue = () => {
            text.value = slider.value;
            calculateAndDraw();
        };
        slider.addEventListener('input', updateValue);
        slider.addEventListener('change', updateValue);
        text.addEventListener('input', () => {
            slider.value = text.value;
            calculateAndDraw();
        });
        text.addEventListener('change', () => {
            slider.value = text.value;
            calculateAndDraw();
        });
    }

    // 모든 슬라이더와 텍스트 동기화
    syncSliderText(weightSlider, weightText);
    syncSliderText(ageSlider, ageText);
    syncSliderText(heightSlider, heightText);
    syncSliderText(caloriesSlider, caloriesText);
    syncSliderText(exerciseTimeSlider, exerciseTimeText);
    syncSliderText(intensitySlider, intensityText);

    // 성별 변경 시 계산
    gender.addEventListener('change', calculateAndDraw);

    // 기간 슬라이더
    const updateDays = () => {
        daysValue.textContent = daysSlider.value;
        calculateAndDraw();
    };
    daysSlider.addEventListener('input', updateDays);
    daysSlider.addEventListener('change', updateDays);

    // 초기화 버튼
    resetButton.addEventListener('click', () => {
        weightText.value = '65';
        weightSlider.value = '65';
        ageText.value = '25';
        ageSlider.value = '25';
        heightText.value = '170';
        heightSlider.value = '170';
        caloriesText.value = '0';
        caloriesSlider.value = '0';
        exerciseTimeText.value = '1';
        exerciseTimeSlider.value = '1';
        intensityText.value = '1';
        intensitySlider.value = '1';
        daysSlider.value = '0';
        daysValue.textContent = '0';
        gender.value = 'male';
        calculateAndDraw();
    });

    function calculateAndDraw() {
        const rawWeight = parseFloat(weightText.value);
        const weight = isNaN(rawWeight) ? 65 : rawWeight;
        const age = parseFloat(ageText.value) || 25;
        const height = parseFloat(heightText.value) || 170;
        const genderValue = gender.value;
        const calories = parseFloat(caloriesText.value) || 0;
        const exerciseTime = parseFloat(exerciseTimeText.value) || 1;
        const intensity = parseInt(intensityText.value) || 1;
        const days = parseInt(daysSlider.value) || 0;

        // 현재 체중 표시 업데이트
        document.getElementById('currentWeightDisplay').textContent = `현재 체중: ${weight.toFixed(1)} kg`;

        // BMR 계산
        let bmr;
        if (genderValue === 'male') {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }

        // TDEE
        const tdee = bmr * 1.2;

        // 칼로리 결핍
        const deficit = calories - tdee;

        // 운동 칼로리
        const exerciseCalories = exerciseTime * (intensity * 100);

        // 칼로리 기반 체중 변화 (높을수록 증가)
        const calorieWeightChange = (deficit * days) / 7700;

        // 운동 강도 기반 체중 감소
        const weeklyExercisePercent = 0.05 + (intensity - 1) * 0.025; // 5% ~ 15%
        const intensitySpeedFactor = 1 - (5 - intensity) * 0.1; // 낮을수록 감량 속도 10%씩 감소
        const agePenalty = Math.max(0, age - 1) * 0.01 +
            (age > 40 ? 0.01 : 0) +
            (age > 50 ? 0.02 : 0) +
            (age > 60 ? 0.05 : 0);
        const exerciseEffectiveness = Math.max(0, 1 - agePenalty);
        const exerciseFactor = Math.min(Math.max(exerciseTime, 0), 1);
        const exerciseWeightLoss = weight * weeklyExercisePercent * intensitySpeedFactor * exerciseEffectiveness * exerciseFactor * (days / 7);

        const weightChange = calorieWeightChange - exerciseWeightLoss;

        let calculatedWeight = weight + weightChange;
        const clampedWeight = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, weight));
        const clampedCalculated = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, calculatedWeight));
        if (calculatedWeight < MIN_WEIGHT) calculatedWeight = MIN_WEIGHT;
        if (calculatedWeight > MAX_WEIGHT) calculatedWeight = MAX_WEIGHT;

        calculatedWeightDisplay.textContent = `예상 체중: ${calculatedWeight.toFixed(1)} kg`;
        relationshipDisplay.textContent = `현재 체중선: 검정, 예측 체중선: 파랑/빨강. 칼로리 변화: ${calorieWeightChange >= 0 ? '증가' : '감소'} ${Math.abs(calorieWeightChange).toFixed(2)}kg, 운동 감량: ${exerciseWeightLoss.toFixed(2)}kg.`;
        updateWarningMessage(weight, calculatedWeight, rawWeight);

        // 사람 그림 그리기
        drawPerson(clampedWeight, clampedCalculated);
    }

    function drawPerson(currentWeight, calculatedWeight) {
        // 기존 선 제거 (점선들)
        while (personSvg.firstChild) {
            personSvg.removeChild(personSvg.firstChild);
        }

        // 현재 체중 점선
        const currentY = 800 - ((currentWeight - 30) / (150 - 30)) * 800;
        const currentLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        currentLine.setAttribute('x1', '0');
        currentLine.setAttribute('y1', currentY);
        currentLine.setAttribute('x2', '600');
        currentLine.setAttribute('y2', currentY);
        currentLine.setAttribute('stroke-width', '4');
        currentLine.classList.add('dashed', 'current-line');
        personSvg.appendChild(currentLine);

        const currentTextLeft = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        currentTextLeft.setAttribute('x', '-10');
        currentTextLeft.setAttribute('y', currentY + 8);
        currentTextLeft.setAttribute('font-size', '16');
        currentTextLeft.setAttribute('text-anchor', 'end');
        currentTextLeft.textContent = currentWeight.toFixed(1) + 'kg';
        currentTextLeft.classList.add('weight-text');
        personSvg.appendChild(currentTextLeft);

        const currentTextRight = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        currentTextRight.setAttribute('x', '610');
        currentTextRight.setAttribute('y', currentY + 8);
        currentTextRight.setAttribute('font-size', '16');
        currentTextRight.textContent = currentWeight.toFixed(1) + 'kg';
        currentTextRight.classList.add('weight-text');
        personSvg.appendChild(currentTextRight);

        const calcY = 800 - ((calculatedWeight - 30) / (150 - 30)) * 800;
        const color = calculatedWeight > currentWeight ? '#1f78b4' : '#e31a1c';
        const calcLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        calcLine.setAttribute('x1', '0');
        calcLine.setAttribute('y1', calcY);
        calcLine.setAttribute('x2', '600');
        calcLine.setAttribute('y2', calcY);
        calcLine.setAttribute('stroke-width', '4');
        calcLine.classList.add('dashed', 'predicted-line');
        calcLine.setAttribute('stroke', color);
        personSvg.appendChild(calcLine);

        const calcTextLeft = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        calcTextLeft.setAttribute('x', '-10');
        calcTextLeft.setAttribute('y', calcY + 8);
        calcTextLeft.setAttribute('font-size', '16');
        calcTextLeft.setAttribute('fill', color);
        calcTextLeft.setAttribute('text-anchor', 'end');
        calcTextLeft.textContent = calculatedWeight.toFixed(1) + 'kg';
        calcTextLeft.classList.add('weight-text');
        personSvg.appendChild(calcTextLeft);

        const calcTextRight = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        calcTextRight.setAttribute('x', '610');
        calcTextRight.setAttribute('y', calcY + 8);
        calcTextRight.setAttribute('font-size', '16');
        calcTextRight.setAttribute('fill', color);
        calcTextRight.textContent = calculatedWeight.toFixed(1) + 'kg';
        calcTextRight.classList.add('weight-text');
        personSvg.appendChild(calcTextRight);
    }

    function updateWarningMessage(weight, calculatedWeight, rawWeight) {
        let message = '';
        if (!isNaN(rawWeight) && rawWeight < MIN_WEIGHT) {
            message = '30kg 이하입니다. 좀 더 칼로리를 100kcal 정도 더 섭취하세요.';
        } else if (!isNaN(rawWeight) && rawWeight > MAX_WEIGHT) {
            message = '150kg 이상입니다. 좀 더 칼로리를 100kcal 정도 덜 섭취하세요. 운동량을 늘려주세요.';
        } else if (calculatedWeight <= MIN_WEIGHT) {
            message = '계산된 체중이 30kg 이하입니다. 칼로리 섭취를 늘리고 과도한 운동은 피하세요.';
        } else if (calculatedWeight >= MAX_WEIGHT) {
            message = '계산된 체중이 150kg 이상입니다. 칼로리 섭취를 줄이고 운동량을 늘려주세요.';
        }
        warningMessage.textContent = message;
        warningMessage.style.display = message ? 'block' : 'none';
    }

    // 초기 계산
    calculateAndDraw();
});