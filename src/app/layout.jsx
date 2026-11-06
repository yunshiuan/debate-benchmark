import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import "./globals.css";

export const metadata = {
  title: "DEBATE — Opinion Dynamics Benchmark",
  description: "NeurIPS 2026 benchmark for evaluating opinion dynamics in role-playing LLM agents: model results, human conversations, personas, and 107 discussion topics.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#1677ff', // You can change this to your brand color
                borderRadius: 6,
              },
            }}
          >
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
