using System;
using System.Collections.Generic;
using System.Text;
using System.Net.Sockets;
using System.Net;
using System.Net.NetworkInformation;
using System.Diagnostics;
using System.Threading;
using System.Globalization;
using System.Runtime.InteropServices;

namespace Parking24web.Server.Services
{
    public class LSIS_FENet : IDisposable
    {
        int m_nPLC = 0;
        int nbyteLength = 512;
        ushort[] m_DataBuff = new ushort[256];

        public ushort[] DataBuff
        {
            get { return m_DataBuff; }
            set { m_DataBuff = value; }
        }

        Socket m_Socket; // 소캣
        IPEndPoint m_localEP, m_remoteEP;

        string m_TargetIP;
        int m_nPCPort, m_nTargPort;

        Thread m_Thread;        // UDP 스레드
        bool m_bTread = false;  // UDP 동작 FLAG

        bool m_bConnect;        // 연결 상태

        bool m_bSendingTx;      // 전송 중 인경우
        int m_nTick;

        Queue<char[]> m_CmdList = new Queue<char[]>();
        byte[] m_cRevcData = new byte[1024];

        public enum HeaderSection : int
        {
            CompanyID_0 = 0,
            CompanyID_1,
            CompanyID_2,
            CompanyID_3,
            CompanyID_4,
            CompanyID_5,
            CompanyID_6,
            CompanyID_7,

            Max,

        }
        //----------------------------

        public LSIS_FENet(int nPLC)
        {
            m_nPCPort = nPLC;
        }

        public bool IsOpen
        {
            get
            {
                return m_bConnect;
            }
        }

        public void Connect(int nPCPort, string TargetIP, int nTargPort)
        {
            m_TargetIP = TargetIP;
            m_nPCPort = nPCPort;
            m_nTargPort = nTargPort;

            if (!m_bTread)
            {
                this.StartThread();		// start thread
            }
        }
        public void DisConnect()
        {
            // 스레드 종료 플래그 설정
            m_bTread = false;

            // Thread.Abort() 호출 제거하고 스레드가 자연스럽게 종료되도록
            if (m_Thread != null)
            {
                // 스레드가 안전하게 종료될 때까지 잠시 대기 (선택사항)
                if (m_Thread.IsAlive)
                {
                    try
                    {
                        m_Thread.Join(500); // 최대 0.5초 대기
                    }
                    catch { }
                }
            }

            // 소켓 연결 종료
            this.ClosePort();
        }


        public void Reset()
        {
            // 스레드 상태이므로 자동연결됨
            this.ClosePort();
        }

        public void Dispose()
        {
            // 연결된 경우 먼저 연결 해제
            if (IsOpen)
            {
                DisConnect();
            }

            // 스레드 종료 확인
            if (m_Thread != null && m_Thread.IsAlive)
            {
                try { m_Thread.Join(1000); } catch { }
                m_Thread = null;
            }

            // 소켓 완전히 해제
            if (m_Socket != null)
            {
                try
                {
                    m_Socket.Dispose(); // 중요! Close()가 아닌 Dispose() 호출
                    m_Socket = null;
                }
                catch { }
            }

            // 명령 큐 정리
            if (m_CmdList != null)
            {
                m_CmdList.Clear();
            }

        }

        //----------------------------

        public void RegisterReadW(string szDevice)
        {
            this.RegisterRead(szDevice);
        }
        public void RegisterGetBRead(string devicetype, int iAddress)
        {
            string device = string.Format("%{0}B{1}", devicetype, iAddress);

            this.RegisterGetWord(device);
        }
        public void RegisterWriteBit(string szDevice, bool pData)
        {
            RegisterWrite(szDevice, pData ? 0x01 : 0x00);
        }
        public void RegisterWriteByte(string szDevice, params byte[] pData)
        {
            if (pData.Length == 1)
            {
                RegisterWrite(szDevice, pData[0]);
            }
            else
            {
                RegisterWriteArray(szDevice, pData);
            }
        }
        public void RegisterWriteW(string szDevice, params ushort[] pData)
        {
            if (pData.Length == 1)
            {
                RegisterWrite(szDevice, pData[0]);
            }
            else
            {
                byte[] bytes = new byte[pData.Length * 2];

                for (int i = 0; i < pData.Length; i++)
                {
                    int nData = pData[i];
                    bytes[i * 2] = (byte)(nData & 0xFF);
                    bytes[(i * 2) + 1] = (byte)(nData >> 8);
                }

                RegisterWriteArray(szDevice, bytes);
            }
        }
        public void RegisterWriteL(string szDevice, params long[] pData)
        {
            if (pData.Length == 1)
            {
                RegisterWrite(szDevice, pData[0]);
            }
            else
            {
                byte[] bytes = new byte[pData.Length * 2];

                for (int i = 0; i < pData.Length; i++)
                {
                    long nData = pData[i];

                    bytes[i * 2] = (byte)(nData & 0xFF);
                    bytes[(i * 2) + 1] = (byte)(nData >> 8);

                    bytes[(i * 2) + 2] = (byte)(nData & 0xFFFF);
                    bytes[(i * 2) + 3] = (byte)(nData >> 16);
                }

                RegisterWriteArray(szDevice, bytes);
            }
        }

        void RegisterRead(string szDevice)
        {
            if (m_CmdList.Count > 0)
            {
                return;
            }

            int nLength = 0, nCnt = 0;
            char[] buf = new char[255];

            Array.Clear(buf, 0, buf.Length);

            // LSIS 고유번호(10)

            buf[nCnt++] = 'L';
            buf[nCnt++] = 'S';
            buf[nCnt++] = 'I';
            buf[nCnt++] = 'S';
            buf[nCnt++] = '-';
            buf[nCnt++] = 'X';
            buf[nCnt++] = 'G';
            buf[nCnt++] = 'T';

            buf[nCnt++] = (char)0x00;
            buf[nCnt++] = (char)0x00;

            // PLC 정보(2)
            buf[nCnt++] = (char)0x00;
            buf[nCnt++] = (char)0x00;

            // CPU 정보(2)
            buf[nCnt++] = (char)0xA0;

            //프레임 방향(1)
            buf[nCnt++] = (char)0x33;

            //프레임 순서번호(2)
            buf[nCnt++] = (char)0x00;
            buf[nCnt++] = (char)0x00;

            //길이(2)
            nLength = szDevice.Length - 4;

            if (nLength < 0)
            {
                nLength = 0;
            }

            nLength += 0x10;

            buf[nCnt++] = (char)nLength;
            buf[nCnt++] = (char)0x00;


            //위치 정보(1)
            buf[nCnt++] = (char)0x00;

            //체크섬(1)
            buf[nCnt++] = (char)ByteCheckSum(buf, 0, nCnt - 1);

            //명령어(2)
            //[ h5400 읽기][ h5800 쓰기 ]

            buf[nCnt++] = (char)0x54;
            buf[nCnt++] = (char)0x00;

            //데이터 타입(2)
            //[ h00 비트 ][ h01 바이트 ][ h02 워드 ][ h03 더블워드 ][ h04 롱워드][ h14 연속]

            buf[nCnt++] = (char)0x14;
            buf[nCnt++] = (char)0x00;

            //예약 영역(2)
            //0x0000 : Don’t Care.
            buf[nCnt++] = (char)0x00;
            buf[nCnt++] = (char)0x00;

            //블록수(2)
            //읽고자 하는 블록의 개수. 0x0001
            buf[nCnt++] = (char)0x01;
            buf[nCnt++] = (char)0x00;

            //변수명 길이(2)
            //변수 명의 길이. 최대 16자.
            buf[nCnt++] = (char)szDevice.Length;
            buf[nCnt++] = (char)0x00;

            //데이터 주소
            //쓰고자 하는 Data, 최대 1400byte

            char[] ch = szDevice.ToCharArray();

            for (int i = 0; i < ch.Length; i++)
            {
                buf[nCnt++] = ch[i];
            }

            //데이터 개수(길이)(2)

            switch (szDevice.Substring(1, 1))
            {
                case "P":
                case "Z":
                case "S":
                    {
                        nLength = 128 * 2;
                        break;
                    }
                default:
                    {
                        nLength = 256 * 2;
                        break;
                    }
            }

            buf[nCnt++] = (char)(nLength & 0xFF); //연속읽기 일 경우 Data length(L)
            buf[nCnt++] = (char)(nLength >> 8);   //연속읽기 일 경우 Data length(H)   

            Array.Resize(ref buf, nCnt);
            m_CmdList.Enqueue(buf);
        }
        void RegisterWrite(string szDevice, long pData)
        {
            string txt = string.Format("{0}-->{1}", szDevice, pData);
            this.DisplayMsg(txt);

            int nLength = 0, nCnt = 0;
            char[] buf = new char[1024];

            Array.Clear(buf, 0, buf.Length);

            // LSIS 고유번호(10)

            buf[nCnt++] = 'L';
            buf[nCnt++] = 'S';
            buf[nCnt++] = 'I';
            buf[nCnt++] = 'S';
            buf[nCnt++] = '-';
            buf[nCnt++] = 'X';
            buf[nCnt++] = 'G';
            buf[nCnt++] = 'T';

            buf[nCnt++] = (char)0x00;
            buf[nCnt++] = (char)0x00;

            // PLC 정보(2)
            buf[nCnt++] = (char)0x00;
            buf[nCnt++] = (char)0x00;

            // CPU 정보(2)
            buf[nCnt++] = (char)0xA0;

            //프레임 방향(1)
            buf[nCnt++] = (char)0x33;

            //프레임 순서번호(2)
            buf[nCnt++] = (char)0x00;
            buf[nCnt++] = (char)0x01;

            //길이(2)

            nLength = szDevice.Length - 4;

            if (nLength < 0)
            {
                nLength = 0;
            }

            nLength += 0x11;

            switch (szDevice.Substring(2, 1))
            {
                case "B":
                case "W":
                    {
                        nLength += 1;
                        break;
                    }
                case "D":
                    {
                        nLength += 2;
                        break;
                    }
                case "L":
                    {
                        nLength += 4;
                        break;
                    }
            }

            //길이(2)
            buf[nCnt++] = (char)(nLength & 0xFF);           // Data length(L)
            buf[nCnt++] = (char)(nLength >> 8);             // Data length(H)   

            //위치 정보(1)
            buf[nCnt++] = (char)0x00;

            //체크섬(1)
            buf[nCnt++] = (char)ByteCheckSum(buf, 0, nCnt - 1);

            //명령어(2)
            //[ h5400 읽기][ h5800 쓰기 ]

            buf[nCnt++] = (char)0x58;
            buf[nCnt++] = (char)0x00;

            //데이터 타입(2)
            //[ h00 비트 ][ h01 바이트 ][ h02 워드 ][ h03 더블워드 ][ h04 롱워드][ h14 연속]

            switch (szDevice.Substring(2, 1))
            {
                case "X":
                    {
                        nLength = 1;
                        buf[nCnt++] = (char)0x00;
                        buf[nCnt++] = (char)0x00;
                        break;
                    }
                case "B":
                    {
                        nLength = 1;

                        buf[nCnt++] = (char)0x01;
                        buf[nCnt++] = (char)0x00;
                        break;
                    }
                case "W":
                    {
                        nLength = 2;

                        buf[nCnt++] = (char)0x02;
                        buf[nCnt++] = (char)0x00;
                        break;
                    }
                case "D":
                    {
                        nLength = 4;

                        buf[nCnt++] = (char)0x03;
                        buf[nCnt++] = (char)0x00;
                        break;
                    }
                case "L":
                    {
                        nLength = 8;

                        buf[nCnt++] = (char)0x04;
                        buf[nCnt++] = (char)0x00;
                        break;
                    }
            }

            //예약 영역(2)
            //0x0000 : Don’t Care.
            buf[nCnt++] = (char)0x00;
            buf[nCnt++] = (char)0x00;

            //블록수(2)
            //읽고자 하는 블록의 개수. 0x0001
            buf[nCnt++] = (char)0x01;
            buf[nCnt++] = (char)0x00;

            //변수명 길이(2)
            //변수 명의 길이. 최대 16자.
            buf[nCnt++] = (char)szDevice.Length;
            buf[nCnt++] = (char)0x00;

            //데이터 주소
            //쓰고자 하는 Data, 최대 1400byte

            char[] ch = szDevice.ToCharArray();

            for (int i = 0; i < ch.Length; i++)
            {
                buf[nCnt++] = ch[i];
            }

            //데이터 개수(2)
            buf[nCnt++] = (char)(nLength & 0xFF);           // Data length(L)
            buf[nCnt++] = (char)(nLength >> 8);             // Data length(H)   


            switch (nLength)
            {
                case 1:
                    {
                        buf[nCnt++] = (char)pData;
                        break;
                    }
                case 2:
                    {
                        buf[nCnt++] = (char)(pData & 0xFF);
                        buf[nCnt++] = (char)(pData >> 8);

                        break;
                    }
                case 4:
                    {
                        buf[nCnt++] = (char)(pData & 0xFF);
                        buf[nCnt++] = (char)(pData >> 8);

                        buf[nCnt++] = (char)(pData & 0xFFFF);
                        buf[nCnt++] = (char)(pData >> 16);

                        break;
                    }
                case 8:
                    {
                        buf[nCnt++] = (char)(pData & 0xFF);
                        buf[nCnt++] = (char)(pData >> 8);

                        buf[nCnt++] = (char)(pData & 0xFFFF);
                        buf[nCnt++] = (char)(pData >> 16);

                        buf[nCnt++] = (char)(pData & 0xFFFF);
                        buf[nCnt++] = (char)(pData >> 32);

                        buf[nCnt++] = (char)(pData & 0xFFFFFFFF);
                        buf[nCnt++] = (char)(pData >> 64);

                        break;
                    }
            }


            Array.Resize(ref buf, nCnt);
            m_CmdList.Enqueue(buf);
        }
        void RegisterWriteArray(string szDevice, params byte[] pData)
        {
            string[] array = Array.ConvertAll(pData, element => element.ToString());
            string txt = string.Format("{0}-->{1}", szDevice, string.Join(",", array));
            this.DisplayMsg(txt);

            int nLength = 0, nCnt = 0;
            char[] buf = new char[1024];

            Array.Clear(buf, 0, buf.Length);

            // LSIS 고유번호(10)

            buf[nCnt++] = 'L';
            buf[nCnt++] = 'S';
            buf[nCnt++] = 'I';
            buf[nCnt++] = 'S';
            buf[nCnt++] = '-';
            buf[nCnt++] = 'X';
            buf[nCnt++] = 'G';
            buf[nCnt++] = 'T';

            buf[nCnt++] = (char)0x00;
            buf[nCnt++] = (char)0x00;

            // PLC 정보(2)
            buf[nCnt++] = (char)0x00;
            buf[nCnt++] = (char)0x00;

            // CPU 정보(2)
            buf[nCnt++] = (char)0xA0;

            //프레임 방향(1)
            buf[nCnt++] = (char)0x33;

            //프레임 순서번호(2)
            buf[nCnt++] = (char)0x00;
            buf[nCnt++] = (char)0x01;

            //길이(2)

            nLength = szDevice.Length - 4;

            if (nLength < 0)
            {
                nLength = 0;
            }

            nLength += 0x10;
            nLength += pData.Length;

            buf[nCnt++] = (char)(nLength & 0xFF);           // Data length(L)
            buf[nCnt++] = (char)(nLength >> 8);             // Data length(H)   

            //위치 정보(1)
            buf[nCnt++] = (char)0x00;

            //체크섬(1)
            buf[nCnt++] = (char)ByteCheckSum(buf, 0, nCnt - 1);

            //명령어(2)
            //[ h5400 읽기][ h5800 쓰기 ]

            buf[nCnt++] = (char)0x58;
            buf[nCnt++] = (char)0x00;

            //데이터 타입(2)
            //[ h00 비트 ][ h01 바이트 ][ h02 워드 ][ h03 더블워드 ][ h04 롱워드][ h14 연속]

            buf[nCnt++] = (char)0x14;
            buf[nCnt++] = (char)0x00;

            //예약 영역(2)
            //0x0000 : Don’t Care.
            buf[nCnt++] = (char)0x00;
            buf[nCnt++] = (char)0x00;

            //블록수(2)
            //읽고자 하는 블록의 개수. 0x0001
            buf[nCnt++] = (char)0x01;
            buf[nCnt++] = (char)0x00;

            //변수명 길이(2)
            //변수 명의 길이. 최대 16자.
            buf[nCnt++] = (char)szDevice.Length;
            buf[nCnt++] = (char)0x00;

            //데이터 주소
            //쓰고자 하는 Data, 최대 1400byte

            char[] ch = szDevice.ToCharArray();

            for (int i = 0; i < ch.Length; i++)
            {
                buf[nCnt++] = ch[i];
            }

            //데이터 개수(2)
            nLength = pData.Length;
            buf[nCnt++] = (char)(nLength & 0xFF);           // Data length(L)
            buf[nCnt++] = (char)(nLength >> 8);             // Data length(H)   

            for (int i = 0; i < pData.Length; i++)
            {
                int nData = pData[i];
                buf[nCnt++] = (char)pData[i];
            }

            Array.Resize(ref buf, nCnt);
            m_CmdList.Enqueue(buf);
        }

        void RegisterGetWord(string szDevice)
        {

            int HCnt = 0, ICnt = 0;
            char[] buf = new char[255];
            char[] format_Header = new char[255];
            char[] format_Instruct = new char[255];

            Array.Clear(buf, 0, buf.Length);
            Array.Clear(format_Header, 0, format_Header.Length);
            Array.Clear(format_Instruct, 0, format_Instruct.Length);

            //명령어(1) Application Header Format
            // LSIS 고유번호(10)

            format_Header[HCnt++] = 'L';
            format_Header[HCnt++] = 'S';
            format_Header[HCnt++] = 'I';
            format_Header[HCnt++] = 'S';
            format_Header[HCnt++] = '-';
            format_Header[HCnt++] = 'X';
            format_Header[HCnt++] = 'G';
            format_Header[HCnt++] = 'T';

            format_Header[HCnt++] = (char)0x00;
            format_Header[HCnt++] = (char)0x00;

            // PLC 정보(2)
            format_Header[HCnt++] = (char)0x00;
            format_Header[HCnt++] = (char)0x00;

            // CPU 정보(2)
            format_Header[HCnt++] = (char)0xA0;

            //프레임 방향(1)
            format_Header[HCnt++] = (char)0x33;

            //프레임 순서번호(2)
            format_Header[HCnt++] = (char)0x00;
            format_Header[HCnt++] = (char)0x01;

            //길이(2)
            nbyteLength = szDevice.Length - 4;

            if (nbyteLength < 0)
            {
                nbyteLength = 0;
            }

            nbyteLength += 0x10;

            format_Header[HCnt++] = (char)nbyteLength; //format_Header[16]
            format_Header[HCnt++] = (char)0x00;    //format_Header[17]

            //위치 정보(1)
            format_Header[HCnt++] = (char)0x00;

            //체크섬(1)
            format_Header[HCnt++] = (char)ByteCheckSum(format_Header, 0, HCnt - 1);

            /////////////////////////////////////////////////////////////////////////////

            //명령어(2)  //Application Instruction Format
            //[ h5400 읽기][ h5800 쓰기 ]

            format_Instruct[ICnt++] = (char)0x54;
            format_Instruct[ICnt++] = (char)0x00;

            //데이터 타입(2)
            //[ h00 비트 ][ h01 바이트 ][ h02 워드 ][ h03 더블워드 ][ h04 롱워드][ h14 연속]

            format_Instruct[ICnt++] = (char)0x14;
            format_Instruct[ICnt++] = (char)0x00;

            //예약 영역(2)
            //0x0000 : Don’t Care.
            format_Instruct[ICnt++] = (char)0x00;
            format_Instruct[ICnt++] = (char)0x00;

            //블록수(2)
            //읽고자 하는 블록의 개수. 0x0100
            format_Instruct[ICnt++] = (char)0x01;
            format_Instruct[ICnt++] = (char)0x00;

            //변수명 길이(2)
            //변수 명의 길이. 최대 16자.
            format_Instruct[ICnt++] = (char)szDevice.Length;
            format_Instruct[ICnt++] = (char)0x00;

            //데이터 주소
            //쓰고자 하는 Data, 최대 1400byte

            char[] ch = szDevice.ToCharArray();

            for (int i = 0; i < ch.Length; i++)
            {
                format_Instruct[ICnt++] = ch[i];
            }


            //데이터 개수(길이)(2)
            switch (szDevice.Substring(1, 1))
            {
                case "P":
                case "Z":
                case "S":
                    {
                        nbyteLength = 256 * 2;
                        break;
                    }
                default:
                    {
                        nbyteLength = 256 * 2;
                        break;
                    }
            }


            format_Instruct[ICnt++] = (char)(nbyteLength & 0xFF); //연속읽기 일 경우 Data length(L)
            format_Instruct[ICnt++] = (char)(nbyteLength >> 8);   //연속읽기 일 경우 Data length(H)   


            Array.Resize(ref format_Header, HCnt);
            Array.Resize(ref format_Instruct, ICnt);

            //Instruct 가변길이 적용
            format_Header[16] = (char)format_Instruct.Length; //format_Header[16]
            format_Header[17] = (char)0x00;                   //format_Header[17]

            for (int i = 0; i < HCnt; i++)
            {
                if (i < HCnt)
                {
                    buf[i] = format_Header[i];
                }
            }
            for (int i = 0; i < ICnt; i++)
            {
                if (i < ICnt)
                {
                    buf[20 + i] = format_Instruct[i];
                }
            }
            Array.Resize(ref buf, HCnt + ICnt);

            m_CmdList.Enqueue(buf);
        }
        //----------------------------

        bool OpenPort(int nPCPort, string TargetIP, int nTargPort)
        {
            try
            {
                if (this.PingTest(TargetIP) == true)
                {
                    this.ClosePort();

                    m_localEP = new IPEndPoint(IPAddress.Any, nPCPort);
                    m_remoteEP = new IPEndPoint(IPAddress.Parse(TargetIP), nTargPort);

                    m_Socket = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
                    m_Socket.SendTimeout = 100;
                    m_Socket.ReceiveTimeout = 100;
                    m_Socket.SendBufferSize = 8192;  // 추가
                    m_Socket.ReceiveBufferSize = 8192;  // 추가
                    m_Socket.Bind(m_localEP);
                    m_bConnect = true;
                }
                else
                {
                    m_bConnect = false;
                }
            }
            catch (System.Exception ex)
            {
                DisplayMsg(ex.Message);
                m_bConnect = false;
            }

            if (m_bConnect)
            {
                string txt = string.Format("Port Open 연결 성공 ( Target = {0} , PC Port= {1} )", m_remoteEP, m_localEP.Port);
                DisplayMsg(txt);
            }
            else
            {
                DisplayMsg("Port Open 연결 실패", false);
            }

            return m_bConnect;
        }
        void ClosePort()
        {
            m_bConnect =
            m_bSendingTx = false;

            try
            {
                m_CmdList.Clear();

                if (m_Socket != null)
                {
                    m_Socket.Close();
                }
            }
            catch (System.Exception ex)
            {
                DisplayMsg("Err. " + ex.Message);
            }

            DisplayMsg("Port Close");
        }
        void StartThread()
        {
            m_bTread = true;
            m_Thread = new Thread(threadUDP);
            m_Thread.Start();
        }

        int cnti = 0;
        void threadUDP()
        {
            while (m_bTread)
            {
                if (!m_bConnect)
                {
                    if (OpenPort(m_nPCPort, m_TargetIP, m_nTargPort) == false)
                    {
                        Thread.Sleep(500);
                        continue;
                    }
                }

                DataRead();
                //LS_TAG.lsDelay(1);

                //CombineProtocol_R(true);//연속읽기

                CommandSend();
                Thread.Sleep(1);
            }

            m_bTread = false;
        }
        void CommandSend()
        {
            if (m_bSendingTx == false)
            {
                if (m_CmdList.Count > 0)
                {
                    char[] data = m_CmdList.Dequeue();

                    if (data == null)
                    {
                        return;
                    }

                    m_bSendingTx = true;
                    m_nTick = Environment.TickCount;


                    byte[] buffer = new byte[data.Length];

                    for (int i = 0; i < buffer.Length; i++)
                    {
                        buffer[i] = (byte)data[i];
                    }

                    //string[] array = Array.ConvertAll(buffer, element => element.ToString("X2"));
                    //string txt = string.Format("TX : {0}", string.Join(" ", array));
                    //this.DisplayMsg(txt);

                    m_Socket.SendTo(buffer, buffer.Length, SocketFlags.None, m_remoteEP);
                }
            }
        }
        object DataRead()
        {
            object GetVal = 0;
            try
            {
                while (m_bConnect && m_Socket.Available > 0)
                {
                    Array.Clear(m_cRevcData, 0, m_cRevcData.Length);
                    int nSize = m_Socket.Receive(m_cRevcData, 0, m_cRevcData.Length, SocketFlags.None);

                    //string[] array = Array.ConvertAll(buffer, element => element.ToString("X2"));
                    //string txt = string.Format("TX : {0}", string.Join(" ", array));
                    //this.DisplayMsg(txt);

                    byte[] bytes = new byte[nSize];
                    Array.Copy(m_cRevcData, bytes, nSize);
                    char[] buffer = Encoding.Default.GetChars(bytes);

                    if (bytes[26] == 0x00 && bytes[27] == 0x00)
                    {
                        if (bytes[20] == 0x55)
                        {
                            int nBock = (ushort)MAKE_WORD(bytes[29], bytes[28]);
                            int nData = (ushort)MAKE_WORD(bytes[31], bytes[30]);

                            // 읽기 응답 : 0x59
                            //[ h0000 비트 ][ h0100 바이트 ][ h0200 워드 ][ h0300 더블워드 ][ h0400 롱워드][ h1400 연속]
                            if (bytes[22] == 0x14)
                            {
                                for (int i = 0; i < nData / 2; i++)
                                {
                                    ushort uData = (ushort)MAKE_WORD(bytes[33 + (i * 2)], bytes[32 + (i * 2)]);

                                    if (uData != m_DataBuff[i])
                                    {
                                        m_DataBuff[i] = uData;
                                    }
                                }

                                // 27= 블록 개수 , 29 = 데이터 갯수
                            }

                            #region

                            //[ h0200 워드 ]
                            if (bytes[22] == 0x02)
                            {
                                for (int i = 0; i < nData / 2; i++)
                                {
                                    ushort uData = (ushort)MAKE_WORD(bytes[33 + (i * 2)], bytes[32 + (i * 2)]);

                                    if (uData != m_DataBuff[i])
                                    {
                                        m_DataBuff[i] = uData;
                                    }
                                }
                                // 27= 블록 개수 , 29 = 데이터 갯수
                            }
                            #endregion
                        }
                        else if (bytes[20] == 0x59)
                        {
                            // 쓰기 응답 : 0x59
                            DisplayMsg("쓰기 응답(0x59)--> 정상");
                        }
                        m_bSendingTx = false;
                        GetVal = m_DataBuff[0];
                    }
                    else
                    {
                        // 에러상태
                        // 에러코드(Hex 1Byte)

                        if (bytes[20] == 0x55)
                        {
                        }
                        else if (bytes[20] == 0x59)
                        {
                            // 쓰기 응답 : 0x59
                        }

                        int nErr = bytes[28];
                        ErrorMessage(nErr);
                    }

                    m_bSendingTx = false;
                }

            }
            catch (System.Exception ex)
            {

            }

            // Error 처리
            if (m_bSendingTx)
            {
                double nTime = Environment.TickCount - m_nTick;

                if (500 < nTime)
                {
                    try
                    {
                        m_Socket.Receive(m_cRevcData);
                    }
                    catch (Exception ex)
                    {
                    }

                    m_bSendingTx = false;

                    // 알람 상태
                    m_CmdList.Clear();
                    DisplayMsg(string.Format("통신 타임 아웃 {0}ms", nTime));
                }
            }
            return GetVal;
        }

        //----------------------------

        string HexToAscii(byte[] pSource, int nPos)
        {
            // Hex값을 문자열 Hex값으로 변환한다

            string buf = "";

            char cc = char.MinValue;

            for (int i = 0; i < nPos; i++)
            {
                if (pSource[i] >= 0x00 && pSource[i] <= 0x09)
                {
                    cc = (char)(pSource[i] + 0x30);
                }
                else if (pSource[i] >= 0x0A && pSource[i] <= 0x0F)
                {
                    cc = (char)(pSource[i] + 0x37);
                }
                else
                {
                    continue;
                }

                buf += cc.ToString();
            }

            return buf;
        }
        string HexToAsciiString(byte[] pSource)
        {
            string buf = "";

            for (int i = 0; i < pSource.Length; i++)
            {
                if (pSource[i] == 0)
                {
                    break;
                }

                buf += string.Format(" {0:X2}", pSource[i]);
            }

            return buf;
        }
        bool PingTest(string _ipAddress)
        {
            // 해당 IP의 연결상태 체크

            Ping pingSender = new Ping();
            PingOptions options = new PingOptions();

            // Use the default Ttl value which is 128,
            // but change the fragmentation behavior.
            options.DontFragment = true;

            // Create a buffer of 32 bytes of data to be transmitted.
            string data = "Test";
            byte[] buffer = Encoding.ASCII.GetBytes(data);

            try
            {
                PingReply reply = pingSender.Send(_ipAddress, 1000, buffer, options);

                DisplayMsg(string.Format("PingTest-->{0}[{1}]", _ipAddress, reply.Status), false);
                return (reply.Status == IPStatus.Success);
            }
            catch (Exception ex)
            {
                Debug.Print(ex.Message);
            }

            return false;
        }
        void DisplayMsg(string strMsg, bool bWriteLog = true)
        {
            //MainFrm.DisplayMsg(strMsg);
        }

        long MAKE_WORD(int _a, int _b)
        {
            return ((int)_a << 8) | _b;
        }
        int ByteCheckSum(char[] buff, int iStart, int iEnd)
        {
            int CheckSum = 0;

            for (int i = iStart; i < iEnd; i++)
            {
                CheckSum = CheckSum + buff[i];

                if (CheckSum > 255)
                {
                    CheckSum = CheckSum - 256;
                }
            }

            return CheckSum;
        }

        void ErrorMessage(int iMsgNo)
        {
            string strErr = "";

            switch (iMsgNo)
            {
                case 0x01:
                    {
                        strErr = "개별 읽기/쓰기 요청시 블록 수가 16 보다 큼";
                        break;
                    }
                case 0x02:
                    {
                        strErr = "X,B,W,D,L 이 아닌 데이터 타입을 수신했음";
                        break;
                    }
                case 0x03:
                    {
                        strErr = "서비스 되지 않는 디바이스를 요구한 경우(XGK : P, M, L, K, R, , XGI : I, Q, M..)";
                        break;
                    }
                case 0x04:
                    {
                        strErr = "각 디바이스별 지원하는 영역을 초과해서 요구한 경우";
                        break;
                    }
                case 0x05:
                    {
                        strErr = "한번에 최대 1400byes 까지 읽거나 쓸 수 있는데 초과해서 요청한 경우(개별 블록 사이즈)";
                        break;
                    }
                case 0x06:
                    {
                        strErr = "한번에 최대 1400byes 까지 읽거나 쓸 수 있는데 초과해서 요청한 경우(블록별 총 사이즈)";
                        break;
                    }
                case 0x75:
                    {
                        strErr = "전용 서비스에서 프레임 헤더의 선두 부분이 잘못된 경우(‘LSIS-GLOFA’)";
                        break;
                    }
                case 0x76:
                    {
                        strErr = "전용 서비스에서 프레임 헤더의 Length가 잘못된 경우";
                        break;
                    }
                case 0x77:
                    {
                        strErr = "전용 서비스에서 프레임 헤더의 Checksum이 잘못된 경우";
                        break;
                    }
                case 0x78:
                    {
                        strErr = "전용 서비스에서 명령어가 잘못된 경우";
                        break;
                    }
                default:
                    {
                        strErr = string.Format("오류가 발생하였습니다. 오류번호:{0}", iMsgNo);
                        break;
                    }
            }

            this.DisplayMsg(strErr);
        }

    }
}