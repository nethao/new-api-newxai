package model

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/operation_setting"
)

func TestGetTopUpCreditQuotaIncludesConfiguredBonus(t *testing.T) {
	oldQuotaPerUnit := common.QuotaPerUnit
	oldBonuses := operation_setting.GetPaymentSetting().AmountBonus
	common.QuotaPerUnit = 500000
	operation_setting.GetPaymentSetting().AmountBonus = map[int]int{100: 20}
	t.Cleanup(func() {
		common.QuotaPerUnit = oldQuotaPerUnit
		operation_setting.GetPaymentSetting().AmountBonus = oldBonuses
	})

	topUp := &TopUp{
		Amount:      100,
		BonusAmount: GetTopUpBonusAmount(100),
	}
	quota, err := GetTopUpCreditQuota(topUp)
	if err != nil {
		t.Fatalf("GetTopUpCreditQuota returned error: %v", err)
	}
	if quota != 60_000_000 {
		t.Fatalf("GetTopUpCreditQuota = %d, want 60000000", quota)
	}
}
