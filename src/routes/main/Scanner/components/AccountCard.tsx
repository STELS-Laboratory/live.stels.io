import React, { useMemo } from "react";
import { AccountOverview } from "./AccountOverview";
import { AssetBalances } from "./AssetBalances";
import { PositionsCard } from "./PositionsCard";
import { OrdersCard } from "./OrdersCard";
import { ProtocolCard } from "./ProtocolCard";
import type { OrderInfo, RawPosition, WalletResponse } from "../types";

interface AccountCardProps {
  walletData: WalletResponse;
}

/**
 * Enhanced AccountCard component with improved organization and styling
 */
export function AccountCard({
  walletData,
}: AccountCardProps): React.ReactElement {
  // Get positions for this account
  const positions = useMemo(() => {
    const allPositions: RawPosition[] = [];
    walletData.positions?.forEach((positionData) => {
      allPositions.push(...(positionData.value.raw.positions || []));
    });
    return allPositions;
  }, [walletData.positions]);

  // Get orders for this account
  const allOrders = useMemo(() => {
    const orders = {
      open: [] as OrderInfo[],
      closed: [] as OrderInfo[],
      canceled: [] as OrderInfo[],
    };

    const combineOrders = (
      orderData: Record<
        string,
        { open: OrderInfo[]; closed: OrderInfo[]; canceled: OrderInfo[] }
      >,
    ): void => {
      Object.values(orderData).forEach((symbolOrders) => {
        orders.open.push(...(symbolOrders.open || []));
        orders.closed.push(...(symbolOrders.closed || []));
        orders.canceled.push(...(symbolOrders.canceled || []));
      });
    };

    walletData.orders?.spot?.forEach((spotData) => {
      combineOrders(
        spotData.value.raw.orders as Record<
          string,
          { open: OrderInfo[]; closed: OrderInfo[]; canceled: OrderInfo[] }
        >,
      );
    });

    walletData.orders?.futures?.forEach((futuresData) => {
      combineOrders(
        futuresData.value.raw.orders as Record<
          string,
          { open: OrderInfo[]; closed: OrderInfo[]; canceled: OrderInfo[] }
        >,
      );
    });

    return orders;
  }, [walletData.orders]);

  return (
    <div className="space-y-6">
      {/* Account Overview */}
      <AccountOverview walletData={walletData} />

      {/* Asset Balances */}
      <AssetBalances coins={walletData.wallet.info.result.list[0].coin} />

      {/* Trading Positions */}
      <PositionsCard positions={positions} />

      {/* Orders */}
      <OrdersCard orders={allOrders} />

      {/* Trading Protocol */}
      {walletData.protocol && <ProtocolCard protocol={walletData.protocol} />}
    </div>
  );
}
