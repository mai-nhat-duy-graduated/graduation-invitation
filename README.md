# 🎓 Graduation Invitation

Thiệp mời tốt nghiệp của **Mai Nhật Duy**, Đại học Tôn Đức Thắng, **10:30 ngày 17/10/2026** (giờ Việt Nam). Thiệp chạy tĩnh trên GitHub Pages; tính năng gửi ảnh và random dùng Supabase. Không cần cài thư viện cho frontend.

## Xem trên máy

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory _site
```

Chuẩn bị `_site/` theo phần **Ảnh mẫu và chạy thử** bên dưới trước khi chạy server. Mở http://localhost:4173. Thử thiệp cá nhân hóa với `http://localhost:4173/?name=Minh`.

## Cập nhật nội dung

Sửa `config.js`: tên, chữ viết tắt, trường, thời gian ISO có múi giờ `+07:00`, địa điểm, link Maps và lời nhắn. Thời gian hiển thị luôn theo Việt Nam dù khách đang ở nước khác.

- **Ảnh cá nhân:** đặt ảnh vào `assets/`, gán `portraitUrl: 'assets/portrait.jpg'`. Khối ảnh chỉ hiện khi có ảnh; nên dùng ảnh WebP/JPEG dưới 500 KB.
- **Nhạc:** đặt file vào `music/` và gán `musicUrl` (hiện dùng `music/Cosmic Echoes.mp3`). Nhạc phát nền, âm lượng 35%, lặp lại và tự phát khi vào trang; nếu trình duyệt chặn tự phát, nhạc bật sau lần chạm hoặc nhấn phím đầu tiên. Nút ♫/Ⅱ bật hoặc tạm dừng nhạc; lựa chọn tắt nhạc của khách được giữ khi mở thiệp lần nữa.
- Thẻ mô tả và nội dung `<noscript>` trong `index.html` là dự phòng cho trình thu thập và thiết bị tắt JavaScript; cập nhật chúng khi thay đổi buổi lễ.

## Link dành riêng cho từng người

Thêm `?name=` với tên đã URL-encode vào đường dẫn thiệp:

```text
https://mai-nhat-duy-graduated.github.io/graduation-invitation/?name=Minh
```

Tên được đưa vào trang bằng `textContent`, tối đa 80 ký tự. Tên trong URL có thể được chia sẻ cùng đường link, nên chỉ dùng tên gọi thân mật, tránh thông tin nhạy cảm. Dùng đường dẫn website đã xuất bản để tạo thiệp riêng và gửi cho khách.

## Xuất bản miễn phí trên GitHub Pages

1. Đẩy mã nguồn lên nhánh `main` của repository.
2. Vào **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Vào **Actions → Deploy invitation to GitHub Pages → Run workflow** nếu workflow chưa tự chạy.
4. Sau khi workflow thành công, website sẽ ở:
   **https://mai-nhat-duy-graduated.github.io/graduation-invitation/**

Workflow chỉ đóng gói file giao diện công khai, `assets/`, `memes/` và `music/`; không xuất bản README hay các file dự án khác. Giữ repository public để dùng Pages với gói GitHub Free. Hướng dẫn chính thức: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Trải nghiệm

Phần lời nhắn là một phong thư xanh có dấu niêm phong vàng. Chạm phong thư (hoặc nhấn Enter/Space khi dùng bàn phím) để tách dấu sáp, lật nắp và mở tờ giấy chứa lời mời cá nhân hóa. Dùng **Gấp thư lại** hoặc Escape để đóng thư. Chế độ giảm chuyển động hiển thị ngay trạng thái mới; khi tắt JavaScript, nội dung thư vẫn hiện. Các phần bên dưới xuất hiện khi cuộn, đồng hồ đếm ngược, link Maps và hỗ trợ giảm chuyển động. Phần kết thiệp chỉ ghi “Phải đến nhé”. Ảnh và nhạc là tùy chọn. Font tải từ Google Fonts, có font hệ thống dự phòng; các tương tác cơ bản chạy bằng JavaScript thuần; video gửi xe dùng trình phát Facebook.

## Bản đồ khuôn viên và hướng dẫn gửi xe

Google Maps được nhúng ngay dưới thông tin buổi lễ. `mapsEmbedUrl` trong `config.js` cấu hình bản đồ nhúng (để trống để ẩn); `mapsUrl` giữ link mở ứng dụng để xem đường đi. Khi đổi địa điểm, cập nhật cả hai link.

Phần **Thông tin cần thiết** dùng một ảnh tĩnh lấy từ bản đồ khuôn viên trên https://discovery.tdtu.edu.vn/. Có 20 điểm đánh dấu và tên khu vực được vẽ cố định trên ảnh, theo đúng tọa độ hotspot của bản đồ trường. Không nhúng website trường, không có trình xem 3D hoặc chuyển động.

- `assets/tdtu-campus-map.jpg`: ảnh đầy đủ **11285 × 6684 pixel**, khoảng **4.2 MB**, ghép từ các mảnh ảnh gốc của trường. Khách chạm vào ảnh hoặc **Xem ảnh bản đồ** để mở ảnh trong tab riêng và phóng to trên điện thoại.
- `assets/tdtu-campus-map-preview.webp`: ảnh xem trước **1500 × 888 pixel**, khoảng **152 KB**, được tải khi cuộn gần phần bản đồ. Ảnh đầy đủ chỉ tải khi khách mở.
- Sửa `campusMapUrl` và `campusMapPreviewUrl` trong `config.js` để thay ảnh. `campusMapSource` trỏ đến nguồn trường.
- `parkingVideoUrl` là video hướng dẫn gửi xe do bạn cung cấp. Trình phát Facebook hiển thị ngay trong thẻ **Gửi xe ở đâu?**, tải khi khách cuộn gần video và không tự động phát. Có link Facebook dự phòng.

Các nhãn được tạo bằng `scripts/label-campus-map.py` (Python + Pillow), với dữ liệu tọa độ trong `assets/tdtu-campus-points.json`. Ảnh gốc dùng để tạo lại nhãn được giữ ở `scripts/source/tdtu-campus-map-original.jpg`; file này không được đưa vào bản xuất bản GitHub Pages.

## Gửi ảnh kiểu chụp và random

Khách gửi **một ảnh bắt buộc**, mô tả tùy chọn ngay trên thiệp. Tên người gửi tự lấy từ tên người nhận trên thiệp (`?name=`), không cần nhập lại; link không có tên dùng tên mặc định “bạn” như trên thiệp. Ảnh JPEG/PNG/WebP tối đa 5 MB; mô tả tối đa 500 ký tự. Các bài gửi được lưu riêng trên Supabase, không lưu vào GitHub hay folder `memes/`.

Duy mở `random.html`, đăng nhập với tên `duy` (hoặc email Supabase) và mật khẩu tài khoản Auth, rồi random chung từ **19 ảnh mẫu hiện tại trong `memes/` + các ảnh bạn bè gửi**. Mỗi ảnh có cơ hội được chọn bằng nhau. Lịch sử đã rút lưu trên từng trình duyệt/tài khoản; tải lại trang vẫn giữ lịch sử, không đồng bộ thiết bị. Khi hết lượt, bấm **Bắt đầu lượt mới**. **Tải lại nguồn** lấy bài gửi mới và giữ các ID đã rút. Nếu Supabase không tải được dữ liệu bạn bè, trang báo lỗi và vẫn cho dùng ảnh mẫu sau khi đăng nhập.

### Thiết lập Supabase (một lần)

1. Tạo dự án tại [Supabase Dashboard](https://supabase.com/dashboard). Trong **Authentication → Users**, tạo tài khoản email/mật khẩu cho Duy, xác nhận email tài khoản. Trong cấu hình Authentication, **tắt Allow new users to sign up**. Không bật anonymous sign-in; khách gửi qua Edge Function.
2. Sao chép UID của tài khoản Duy. Mở `supabase/schema.sql`, thay UUID `00000000-0000-0000-0000-000000000000` bằng UID này rồi chạy toàn bộ trong **SQL Editor**. Script tạo bảng, bucket riêng tư và quyền đọc chỉ cho UID được cho phép. Chạy trên dự án mới dành cho thiệp; nếu dùng bucket/bảng đã có chính sách khác, rà lại để không có chính sách đọc công khai.
3. Trong `config.js`, điền `supabaseUrl` (Project URL, HTTPS) và `supabasePublishableKey` (publishable key, hoặc legacy anon key). Đây là cấu hình công khai. **Không dùng service-role/secret key, mật khẩu database hoặc mật khẩu đăng nhập trong file frontend.**
4. Cài [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started), đăng nhập và liên kết dự án:

   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase secrets set ALLOWED_ORIGINS=https://mai-nhat-duy-graduated.github.io,http://localhost:4173,http://127.0.0.1:4173
   supabase functions deploy submit-photo-idea --no-verify-jwt
   ```

   Origin không có `/graduation-invitation/` ở cuối. Đổi danh sách khi đổi domain/cổng local. `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` được Supabase cấp trong môi trường Edge Function; không sao chép chúng vào trang web. Function không yêu cầu JWT vì khách không đăng nhập và kiểm tra nội dung phía server. CORS giới hạn browser origin, không phải cơ chế ngăn mọi yêu cầu từ bên ngoài; endpoint nhận bài gửi công khai, chưa có CAPTCHA/quota chống spam.
5. Xuất bản GitHub Pages. Form chỉ báo thành công khi backend xác nhận đã lưu. Chưa cấu hình sẽ hiện thông báo chưa sẵn sàng; trang random yêu cầu cấu hình và đăng nhập.

### Ảnh mẫu và chạy thử

Thêm/bớt ảnh JPEG/PNG/WebP trong `memes/`, rồi tạo lại manifest khi thử local:

```sh
node scripts/build-memes.mjs
node --test tests/*.test.cjs
```

Workflow tự tạo manifest mỗi lần deploy và chỉ đưa các file công khai vào `_site/`. `.env`, SQL, Edge Function và tests không được xuất bản. Khi thử local, phục vụ bản public trong `_site/` thay vì cả thư mục có `.env`:

```sh
mkdir -p _site
cp index.html random.html styles.css config.js app.js photo-core.js photo-submit.js random.js _site/
cp -R assets memes music _site/
python3 -m http.server 4173 --bind 127.0.0.1 --directory _site
```

Kiểm tra sau thiết lập: khách gửi một ảnh → Duy đăng nhập `random.html` → **Tải lại nguồn** → kiểm tra bài gửi xuất hiện. Thử tài khoản khác phải bị từ chối quyền đọc; thử API/bucket khi chưa đăng nhập phải không đọc được ảnh. URL ảnh có thời hạn một giờ; khi ảnh hết hạn, random lại để lấy URL mới. Đăng xuất xóa token khỏi session trình duyệt và ẩn kết quả; lịch sử random vẫn được giữ. Khi gửi bị timeout, backend có thể đã lưu, nên kiểm tra trước khi gửi lại.

Phiên bản này không có gallery công khai, sửa/xóa bài gửi hay lưu ảnh thực tế tại lễ. Bạn có thể quản lý dữ liệu trực tiếp trong Dashboard. Session đăng nhập dùng `sessionStorage` theo tab; lịch sử random dùng `localStorage`. Ảnh được lưu ngay, không cần duyệt. Mỗi người có thể gửi nhiều lần.

Kiểm thử trình duyệt có backend giả lập: dùng Playwright đã cài trong môi trường kiểm thử, chạy server bản public rồi `PREVIEW_URL=http://127.0.0.1:4173 node tests/browser-check.cjs`. Có thể đặt `CHROME_PATH` để dùng Chrome cài sẵn. Script kiểm tra mobile/desktop, gửi ảnh, đăng nhập, signed URL, hết lượt, giữ lịch sử, reset, fallback và đăng xuất. Các bài kiểm tra Node yêu cầu Node 22.13+; không thay thế kiểm tra quyền RLS trên Supabase thật.

### Thiết lập backend qua GitHub Actions

Workflow **Set up photo backend** có thể tạo bảng/bucket, cấp quyền và deploy function từ GitHub. Trong repository **Settings → Secrets and variables → Actions**, thêm:

- Secret `SUPABASE_ACCESS_TOKEN`: personal access token của tài khoản Supabase có quyền trên dự án. Token chỉ chạy ở workflow backend, không được đưa vào GitHub Pages.
- Variable `SUPABASE_PROJECT_REF`: `uhvvgzpahsybpuzspnux`.
- Variable `PHOTO_ADMIN_UID`: UUID tài khoản Duy từ **Supabase Authentication → Users**, không phải username GitHub.
- Variable `PHOTO_ALLOWED_ORIGINS`: `https://mai-nhat-duy-graduated.github.io,http://localhost:4173,http://127.0.0.1:4173`.

Chạy workflow thủ công tại **Actions → Set up photo backend → Run workflow**. Nếu chưa có tài khoản Auth, có thể chạy workflow trước để mở tính năng gửi ảnh; quyền xem ảnh vẫn bị khóa. Sau khi tạo tài khoản, đặt PHOTO_ADMIN_UID và chạy lại để cấp quyền. Script dùng Supabase Management API và transaction để chạy SQL, nên không cần đưa password database hoặc service-role key lên GitHub. Chạy trên dự án mới dành cho thiệp; script không xóa các admin đã được cấp trước đó. Hướng dẫn chính thức: [Supabase deploy qua GitHub Actions](https://supabase.com/docs/guides/functions/examples/github-actions).

Tên đăng nhập `duy` được Edge Function `admin-login` ánh xạ đến tài khoản `PHOTO_ADMIN_UID` phía server. Mật khẩu được kiểm tra qua Supabase Auth, không lưu trong frontend/config/workflow. Đổi mật khẩu trong Supabase Authentication khi cần. Khi deploy bằng CLI thủ công, đặt secret `PHOTO_ADMIN_UID` và deploy thêm `admin-login --no-verify-jwt`.
