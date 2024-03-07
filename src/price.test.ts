import { describe, it, expect } from "vitest";

import {
  PREMIUM_OFFSET,
  PREMIUM_START_PRICE,
  Price,
  convertCurrencyWithRates,
  formattedPrice,
  subtractPrices,
  temporaryPremiumPriceAtTimestamp,
} from "./price";
import { Currency, PriceCurrencyFormat } from "./currency";
import { GRACE_PERIOD, ONE_DAY_IN_SECONDS } from "./time";

enum CurrencyTestScenario {
  "UNDERFLOW",
  "MIN",
  "REGULAR",
  "MAX",
  "OVERFLOW",
}

type CurrencyTestInput = {
  fromPrice: Price;
  toCurrency: Currency;
  expectedOutput: string;
};

const underflowCurrencyPriceTest: Record<Currency, CurrencyTestInput> = {
  [Currency.Gas]: {
    fromPrice: { value: 0n, currency: Currency.Gas },
    toCurrency: Currency.Gas,
    expectedOutput:
      PriceCurrencyFormat[Currency.Gas].MinDisplayValue.toString(),
  },
  [Currency.Usd]: {
    fromPrice: { value: 0n, currency: Currency.Usd },
    toCurrency: Currency.Usd,
    expectedOutput:
      PriceCurrencyFormat[Currency.Usd].MinDisplayValue.toString(),
  },
  [Currency.Eth]: {
    fromPrice: { value: 0n, currency: Currency.Eth },
    toCurrency: Currency.Eth,
    expectedOutput:
      PriceCurrencyFormat[Currency.Eth].MinDisplayValue.toString(),
  },
  [Currency.Weth]: {
    fromPrice: { value: 0n, currency: Currency.Weth },
    toCurrency: Currency.Weth,
    expectedOutput:
      PriceCurrencyFormat[Currency.Weth].MinDisplayValue.toString(),
  },
  [Currency.Dai]: {
    fromPrice: { value: 0n, currency: Currency.Dai },
    toCurrency: Currency.Dai,
    expectedOutput:
      PriceCurrencyFormat[Currency.Dai].MinDisplayValue.toString(),
  },
  [Currency.Usdc]: {
    fromPrice: { value: 0n, currency: Currency.Usdc },
    toCurrency: Currency.Usdc,
    expectedOutput:
      PriceCurrencyFormat[Currency.Usdc].MinDisplayValue.toString(),
  },
};

const minCurrencyPriceTest: Record<Currency, CurrencyTestInput> = {
  [Currency.Gas]: {
    fromPrice: { value: 1n, currency: Currency.Gas },
    toCurrency: Currency.Gas,
    expectedOutput:
      PriceCurrencyFormat[Currency.Gas].MinDisplayValue.toString(),
  },
  [Currency.Usd]: {
    fromPrice: { value: 1n, currency: Currency.Usdc },
    toCurrency: Currency.Usd,
    expectedOutput:
      PriceCurrencyFormat[Currency.Usd].MinDisplayValue.toString(),
  },
  [Currency.Eth]: {
    fromPrice: { value: 100000000000000n, currency: Currency.Eth },
    toCurrency: Currency.Eth,
    expectedOutput:
      PriceCurrencyFormat[Currency.Eth].MinDisplayValue.toString(),
  },
  [Currency.Weth]: {
    fromPrice: { value: 100000000000000n, currency: Currency.Weth },
    toCurrency: Currency.Weth,
    expectedOutput:
      PriceCurrencyFormat[Currency.Weth].MinDisplayValue.toString(),
  },
  [Currency.Dai]: {
    fromPrice: { value: 100000000000000n, currency: Currency.Dai },
    toCurrency: Currency.Dai,
    expectedOutput:
      PriceCurrencyFormat[Currency.Dai].MinDisplayValue.toString(),
  },
  [Currency.Usdc]: {
    fromPrice: { value: 1n, currency: Currency.Usdc },
    toCurrency: Currency.Usdc,
    expectedOutput:
      PriceCurrencyFormat[Currency.Usdc].MinDisplayValue.toString(),
  },
};

const regularPricesForEveryCurrency: Record<Currency, CurrencyTestInput> = {
  [Currency.Gas]: {
    fromPrice: { value: 100n, currency: Currency.Gas },
    toCurrency: Currency.Gas,
    expectedOutput: "100",
  },
  [Currency.Usd]: {
    fromPrice: { value: 150000n, currency: Currency.Usd },
    toCurrency: Currency.Usd,
    expectedOutput: "1,500.00",
  },
  [Currency.Eth]: {
    fromPrice: { value: 54000000000000000n, currency: Currency.Eth },
    toCurrency: Currency.Eth,
    expectedOutput: "0.054",
  },
  [Currency.Weth]: {
    fromPrice: { value: 54000000000000000n, currency: Currency.Weth },
    toCurrency: Currency.Weth,
    expectedOutput: "0.054",
  },
  [Currency.Dai]: {
    fromPrice: { value: 1500000000000000000000n, currency: Currency.Dai },
    toCurrency: Currency.Dai,
    expectedOutput: "1,500.00",
  },
  [Currency.Usdc]: {
    fromPrice: { value: 150000000n, currency: Currency.Usdc },
    toCurrency: Currency.Usdc,
    expectedOutput: "1,500.00",
  },
};

const maxPricesForEveryCurrency: Record<Currency, CurrencyTestInput> = {
  [Currency.Gas]: {
    fromPrice: { value: 350000n, currency: Currency.Gas },
    toCurrency: Currency.Gas,
    expectedOutput: "350,000",
  },
  [Currency.Usd]: {
    fromPrice: { value: 9999999999n, currency: Currency.Usd },
    toCurrency: Currency.Usd,
    expectedOutput: "99,999,999.99",
  },
  [Currency.Eth]: {
    fromPrice: { value: 9999999900000000000000000n, currency: Currency.Eth },
    toCurrency: Currency.Eth,
    expectedOutput: "999,999.99",
  },
  [Currency.Weth]: {
    fromPrice: { value: 9999999900000000000000000n, currency: Currency.Weth },
    toCurrency: Currency.Weth,
    expectedOutput: "999,999.99",
  },
  [Currency.Dai]: {
    fromPrice: { value: 99999999990000000000000000n, currency: Currency.Dai },
    toCurrency: Currency.Dai,
    expectedOutput: "99,999,999.99",
  },
  [Currency.Usdc]: {
    fromPrice: { value: 9999999999000n, currency: Currency.Usdc },
    toCurrency: Currency.Usdc,
    expectedOutput: "99,999,999.99",
  },
};

const overflowPricesForEveryCurrency: Record<Currency, CurrencyTestInput> = {
  [Currency.Gas]: {
    fromPrice: { value: 350001n, currency: Currency.Gas },
    toCurrency: Currency.Gas,
    expectedOutput:
      PriceCurrencyFormat[Currency.Gas].OverflowDisplayPrice.toString(),
  },
  [Currency.Usd]: {
    fromPrice: { value: 100000000000n, currency: Currency.Usd },
    toCurrency: Currency.Usd,
    expectedOutput:
      PriceCurrencyFormat[Currency.Usd].OverflowDisplayPrice.toString(),
  },
  [Currency.Eth]: {
    fromPrice: { value: 10000000000000000000000000n, currency: Currency.Eth },
    toCurrency: Currency.Eth,
    expectedOutput:
      PriceCurrencyFormat[Currency.Eth].OverflowDisplayPrice.toString(),
  },
  [Currency.Weth]: {
    fromPrice: { value: 10000000000000000000000000n, currency: Currency.Weth },
    toCurrency: Currency.Weth,
    expectedOutput:
      PriceCurrencyFormat[Currency.Weth].OverflowDisplayPrice.toString(),
  },
  [Currency.Dai]: {
    fromPrice: { value: 1000000000000000000000000000n, currency: Currency.Dai },
    toCurrency: Currency.Dai,
    expectedOutput:
      PriceCurrencyFormat[Currency.Dai].OverflowDisplayPrice.toString(),
  },
  [Currency.Usdc]: {
    fromPrice: { value: 10000000000000n, currency: Currency.Usdc },
    toCurrency: Currency.Usdc,
    expectedOutput:
      PriceCurrencyFormat[Currency.Usdc].OverflowDisplayPrice.toString(),
  },
};

const currencyTestInputs: Record<
  CurrencyTestScenario,
  Record<Currency, CurrencyTestInput>
> = {
  [CurrencyTestScenario.UNDERFLOW]: underflowCurrencyPriceTest,
  [CurrencyTestScenario.MIN]: minCurrencyPriceTest,
  [CurrencyTestScenario.REGULAR]: regularPricesForEveryCurrency,
  [CurrencyTestScenario.MAX]: maxPricesForEveryCurrency,
  [CurrencyTestScenario.OVERFLOW]: overflowPricesForEveryCurrency,
};

/*
  Mock generated at January 5th of 2024.
  There is no need to constantly update this mock because
  we are not actually doing currency conversions in this test.
  This mock is used to fulfill the dependency of the function
  on the exchange rates object.
*/
const exchangeRatesMock = {
  ETH: 2277.56570676,
  DAI: 1.0000538,
  USDC: 0.99996938,
  WETH: 2277.56570676,
  USD: 1,
  GAS: 1,
  savedAt: "2024-01-04T19:04:15.194Z",
};

const runCurrencyTestsForScenario = (
  scenario: CurrencyTestScenario,
  currency: Currency
) => {
  const test = currencyTestInputs[scenario][currency];

  const exchangedPrice = convertCurrencyWithRates(
    test.fromPrice,
    test.toCurrency,
    exchangeRatesMock
  );

  const resFormatted = formattedPrice({
    price: exchangedPrice,
  });

  return {
    output: resFormatted,
    expectedOutput: test.expectedOutput,
  };
};

describe("Currencies underflow displaying", () => {
  it("GAS - Underflow", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.UNDERFLOW,
      Currency.Gas
    );

    console.log("GAS Underflow is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("USD - Underflow", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.UNDERFLOW,
      Currency.Usd
    );

    console.log("USD Underflow is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("ETH - Underflow", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.UNDERFLOW,
      Currency.Eth
    );

    console.log("ETH Underflow is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("WETH - Underflow", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.UNDERFLOW,
      Currency.Weth
    );

    console.log("WETH Underflow is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("DAI - Underflow", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.UNDERFLOW,
      Currency.Dai
    );

    console.log("DAI Underflow is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("USDC - Underflow", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.UNDERFLOW,
      Currency.Usdc
    );

    console.log("USDC Underflow is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
});

describe("Currencies min value displaying", () => {
  it("USD - Min", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.MIN,
      Currency.Usd
    );

    console.log("USD Min is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("ETH - Min", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.MIN,
      Currency.Eth
    );

    console.log("ETH Min is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("WETH - Min", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.MIN,
      Currency.Weth
    );

    console.log("WETH Min is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("DAI - Min", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.MIN,
      Currency.Dai
    );

    console.log("DAI Min is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("USDC - Min", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.MIN,
      Currency.Usdc
    );

    console.log("USDC Min is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
});

describe("Currencies regular values displaying", () => {
  it("USD - Regular", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.REGULAR,
      Currency.Usd
    );

    console.log("USD Regular is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("ETH - Regular", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.REGULAR,
      Currency.Eth
    );

    console.log("ETH Regular is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("WETH - Regular", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.REGULAR,
      Currency.Weth
    );

    console.log("WETH Regular is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("DAI - Regular", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.REGULAR,
      Currency.Dai
    );

    console.log("DAI Regular is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("USDC - Regular", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.REGULAR,
      Currency.Usdc
    );

    console.log("USDC Regular is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
});

describe("Currencies max values displaying", () => {
  it("GAS - Max", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.MAX,
      Currency.Gas
    );

    console.log("GAS Max is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("USD - Max", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.MAX,
      Currency.Usd
    );

    console.log("USD Max is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  /*
    We are not testing ETH, WETH and DAI max values because
    these represent "999,999.99", "999,999.99" and "999,999,999.99",
    respectively, because the logic we have nowadays does not allow
    for these values to be displayed, rounding these to the respective
    currency's overflow value.
  */
  it("USDC - Max", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.MAX,
      Currency.Usdc
    );

    console.log("USDC Max is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
});

describe("Currencies overflow values displaying", () => {
  it("GAS - Overflow", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.OVERFLOW,
      Currency.Gas
    );

    console.log("GAS Overflow is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("USD - Overflow", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.OVERFLOW,
      Currency.Usd
    );

    console.log("USD Overflow is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("ETH - Overflow", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.OVERFLOW,
      Currency.Eth
    );

    console.log("ETH Overflow is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("WETH - Overflow", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.OVERFLOW,
      Currency.Weth
    );

    console.log("WETH Overflow is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("DAI - Overflow", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.OVERFLOW,
      Currency.Dai
    );

    console.log("DAI Overflow is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
  it("USDC - Overflow", () => {
    const result = runCurrencyTestsForScenario(
      CurrencyTestScenario.OVERFLOW,
      Currency.Usdc
    );

    console.log("USDC Overflow is ", result);

    expect(result.output).toBe(result.expectedOutput);
  });
});

describe("Should correctly calculate premium prices for:", () => {
  it("A domain that was released to the market 20 days ago", () => {
    const hardcodedNow = 1707054623n; // 2024-02-04 13:50:23 UTC
    const exampleExpirationTime = hardcodedNow - ONE_DAY_IN_SECONDS * 20n; // 20 days before hardcodedNow

    const result = temporaryPremiumPriceAtTimestamp(
      hardcodedNow,
      exampleExpirationTime - GRACE_PERIOD
    );

    expect(result).toStrictEqual({
      value: 4768n,
      currency: Currency.Usd,
    });
  });

  it("A domain that was released to the market 20 days and a half ago", () => {
    const hardcodedNow = 1707054623n; // 2024-02-04 13:50:23 UTC
    const exampleExpirationTime =
      hardcodedNow - (ONE_DAY_IN_SECONDS * 41n) / 2n; // 20.5 days before hardcodedNow

    const result = temporaryPremiumPriceAtTimestamp(
      hardcodedNow,
      exampleExpirationTime - GRACE_PERIOD
    );

    expect(result).toStrictEqual({
      value: 1975n,
      currency: Currency.Usd,
    });
  });

  it("A domain that was released to the market 1 day and a half ago", () => {
    const hardcodedNow = 1707054623n; // 2024-02-04 13:50:23 UTC
    const expirationTime = hardcodedNow - (ONE_DAY_IN_SECONDS * 3n) / 2n; // 1.5 days before hardcodedNow
    console.log("exactly 1.5 days ago - expirationTime: ", expirationTime);
    const result = temporaryPremiumPriceAtTimestamp(
      hardcodedNow,
      expirationTime - GRACE_PERIOD
    );

    expect(result).toStrictEqual({
      value: 3535529137n,
      currency: Currency.Usd,
    });
  });

  it("A domain that was released to the market 20 days, 23 hours and 59 minutes ago", () => {
    const hardcodedNow = 1707054623n; // 2024-02-04 13:50:23 UTC
    const TWENTY_DAYS_TWENTY_THREE_HOURS_TWENTY_NINE_MINUTES_IN_SECONDS =
      1814340n;
    const expirationTime =
      hardcodedNow -
      TWENTY_DAYS_TWENTY_THREE_HOURS_TWENTY_NINE_MINUTES_IN_SECONDS; // 1 minute from not having a premium price

    const result = temporaryPremiumPriceAtTimestamp(
      hardcodedNow,
      expirationTime - GRACE_PERIOD
    );

    expect(result).toStrictEqual({
      value: 2n,
      currency: Currency.Usd,
    });
  });

  it("A domain that was just now released to the market", () => {
    const hardcodedNow = 1707054623n;
    const expirationTime = hardcodedNow; // Exactly at expiration
    console.log(
      "exactly at expiration - exampleExpirationTime: ",
      expirationTime
    );
    const result = temporaryPremiumPriceAtTimestamp(
      hardcodedNow,
      expirationTime - GRACE_PERIOD
    );

    // Expect full premium value (which is not $100M, but, $100M - PREMIUM_OFFSET instead)
    expect(result).toStrictEqual(
      subtractPrices(PREMIUM_START_PRICE, PREMIUM_OFFSET)
    );
  });
});
