export type GoalProtectionInput = {
  goalId: string;
  reserveTarget: number;
  weight: number;
};

export type GoalProtectionAllocation = {
  goalId: string;
  protectedAmount: number;
  unmetAmount: number;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function distributeGoalProtection(
  amount: number,
  goals: GoalProtectionInput[]
): GoalProtectionAllocation[] {
  let remainingPool = Math.max(amount, 0);
  const activeGoals = goals
    .filter((goal) => goal.reserveTarget > 0 && goal.weight > 0)
    .map((goal) => ({ ...goal, protectedAmount: 0 }));

  while (
    remainingPool > 0.009 &&
    activeGoals.some((goal) => goal.reserveTarget > goal.protectedAmount)
  ) {
    const eligibleGoals = activeGoals.filter(
      (goal) => goal.reserveTarget - goal.protectedAmount > 0.009
    );
    const totalWeight = eligibleGoals.reduce((sum, goal) => sum + goal.weight, 0);

    if (totalWeight <= 0) {
      break;
    }

    let distributedThisRound = 0;

    for (const goal of eligibleGoals) {
      const remainingGoalCapacity = goal.reserveTarget - goal.protectedAmount;
      const theoreticalShare = (remainingPool * goal.weight) / totalWeight;
      const appliedShare = Math.min(remainingGoalCapacity, theoreticalShare);

      goal.protectedAmount += appliedShare;
      distributedThisRound += appliedShare;
    }

    if (distributedThisRound <= 0.009) {
      break;
    }

    remainingPool -= distributedThisRound;
  }

  return activeGoals.map((goal) => ({
    goalId: goal.goalId,
    protectedAmount: roundCurrency(goal.protectedAmount),
    unmetAmount: roundCurrency(Math.max(goal.reserveTarget - goal.protectedAmount, 0))
  }));
}
