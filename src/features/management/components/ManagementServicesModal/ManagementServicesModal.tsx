import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ModalCloseButton,
  SearchFilterBar,
  TableFooter,
  filterBySearchQuery,
} from "../../../../components";
import { useI18n } from "../../../../i18n";
import "./ManagementServicesModal.scss";

const SERVICES_PER_PAGE = 3;

type ServicePreview = {
  id: number;
  is_active: boolean;
  name: string;
  price: string;
};

type ServiceFormMode = "add" | "edit";

type ServiceFormState = {
  isActive: boolean;
  name: string;
  price: string;
};

type ActiveServiceForm = {
  mode: ServiceFormMode;
  service?: ServicePreview;
};

interface ManagementServicesModalProps {
  onClose: () => void;
}

function getInitialFormState(service?: ServicePreview): ServiceFormState {
  return {
    isActive: service?.is_active ?? true,
    name: service?.name ?? "",
    price: service?.price ?? "",
  };
}

export function ManagementServicesModal({
  onClose,
}: ManagementServicesModalProps) {
  const { t } = useI18n();
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeForm, setActiveForm] = useState<ActiveServiceForm | null>(null);
  const [formState, setFormState] = useState<ServiceFormState>(
    getInitialFormState(),
  );

  const services = useMemo<ServicePreview[]>(
    () => [
      { id: 1, name: "Electricity", price: "50.00", is_active: true },
      { id: 2, name: "Cleaning", price: "25.00", is_active: true },
      {
        id: 3,
        name: "Premium Booth Setup",
        price: "150.00",
        is_active: false,
      },
    ],
    [],
  );

  const visibleServices = useMemo(() => {
    return filterBySearchQuery(services, searchValue, (service) => [
      service.name,
    ]);
  }, [searchValue, services]);

  const totalServicePages = Math.max(
    1,
    Math.ceil(visibleServices.length / SERVICES_PER_PAGE),
  );
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalServicePages);
  const paginatedServices = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * SERVICES_PER_PAGE;

    return visibleServices.slice(startIndex, startIndex + SERVICES_PER_PAGE);
  }, [safeCurrentPage, visibleServices]);

  const formTitle =
    activeForm?.mode === "edit"
      ? t.management.servicesModal.editTitle
      : t.management.servicesModal.addTitle;
  const isSaveDisabled =
    !formState.name.trim() || !formState.price.trim() || !activeForm;

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  function openAddForm() {
    setActiveForm({ mode: "add" });
    setFormState(getInitialFormState());
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    setCurrentPage(1);
  }

  function openEditForm(service: ServicePreview) {
    setActiveForm({ mode: "edit", service });
    setFormState(getInitialFormState(service));
  }

  function closeForm() {
    setActiveForm(null);
    setFormState(getInitialFormState());
  }

  function updateFormField(
    field: keyof ServiceFormState,
    value: string | boolean,
  ) {
    setFormState((currentFormState) => ({
      ...currentFormState,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaveDisabled) {
      return;
    }

    closeForm();
  }

  return (
    <div className="management-services-modal" role="presentation">
      <div
        className="management-services-modal__backdrop"
        onClick={onClose}
      />

      <section
        className="management-services-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="management-services-title"
        aria-describedby="management-services-description"
      >
        <header className="management-services-modal__header">
          <div className="management-services-modal__copy">
            <h2 id="management-services-title">
              {t.management.servicesModal.title}
            </h2>
            <p id="management-services-description">
              {t.management.servicesModal.description}
            </p>
          </div>

          <ModalCloseButton ariaLabel={t.common.close} onClick={onClose} />
        </header>

        <div className="management-services-modal__toolbar">
          <SearchFilterBar
            className="management-services-modal__search"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder={t.management.servicesModal.searchPlaceholder}
            inputAriaLabel={t.management.servicesModal.searchAriaLabel}
            filterLabel={t.management.servicesModal.filter}
            filterAriaLabel={t.management.servicesModal.filterAriaLabel}
            showFilterButton
          />

          <button
            className="management-services-modal__add-button"
            type="button"
            onClick={openAddForm}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M10 3.25c.41 0 .75.34.75.75v5.25H16a.75.75 0 0 1 0 1.5h-5.25V16a.75.75 0 0 1-1.5 0v-5.25H4a.75.75 0 0 1 0-1.5h5.25V4c0-.41.34-.75.75-.75Z" />
            </svg>
            <span>{t.management.servicesModal.addService}</span>
          </button>
        </div>

        {activeForm ? (
          <form
            className="management-services-modal__form"
            aria-label={formTitle}
            onSubmit={handleSubmit}
          >
            <div className="management-services-modal__form-header">
              <h3>{formTitle}</h3>
              {activeForm.service ? <span>#{activeForm.service.id}</span> : null}
            </div>

            <div className="management-services-modal__form-grid">
              <label className="management-services-modal__field">
                <span>{t.management.servicesModal.serviceName}</span>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) =>
                    updateFormField("name", event.target.value)
                  }
                />
              </label>

              <label className="management-services-modal__field">
                <span>{t.management.servicesModal.price}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.price}
                  onChange={(event) =>
                    updateFormField("price", event.target.value)
                  }
                />
              </label>

              {activeForm.mode === "edit" ? (
                <label className="management-services-modal__toggle">
                  <input
                    type="checkbox"
                    checked={formState.isActive}
                    onChange={(event) =>
                      updateFormField("isActive", event.target.checked)
                    }
                  />
                  <span>{t.management.servicesModal.active}</span>
                </label>
              ) : null}
            </div>

            <div className="management-services-modal__form-actions">
              <button
                className="management-services-modal__button management-services-modal__button--secondary"
                type="button"
                onClick={closeForm}
              >
                {t.management.servicesModal.cancel}
              </button>
              <button
                className="management-services-modal__button management-services-modal__button--primary"
                type="submit"
                disabled={isSaveDisabled}
              >
                {t.management.servicesModal.save}
              </button>
            </div>
          </form>
        ) : null}

        <div
          className="management-services-modal__table"
          role="table"
          aria-label={t.management.servicesModal.title}
        >
          <div
            className="management-services-modal__table-head"
            role="rowgroup"
          >
            <div className="management-services-modal__row" role="row">
              <div role="columnheader">
                {t.management.servicesModal.serviceName}
              </div>
              <div role="columnheader">{t.management.servicesModal.price}</div>
              <div role="columnheader">{t.management.servicesModal.status}</div>
              <div role="columnheader">
                {t.management.servicesModal.actions}
              </div>
            </div>
          </div>

          <div
            className="management-services-modal__table-body"
            role="rowgroup"
          >
            {paginatedServices.map((service) => {
              const statusLabel = service.is_active
                ? t.management.servicesModal.active
                : t.management.servicesModal.inactive;
              const statusClassName = service.is_active
                ? "management-services-modal__status management-services-modal__status--active"
                : "management-services-modal__status management-services-modal__status--inactive";

              return (
                <div
                  className="management-services-modal__row"
                  role="row"
                  key={service.id}
                >
                  <div
                    className="management-services-modal__cell management-services-modal__cell--primary"
                    role="cell"
                    data-label={t.management.servicesModal.serviceName}
                  >
                    {service.name}
                  </div>
                  <div
                    className="management-services-modal__cell"
                    role="cell"
                    data-label={t.management.servicesModal.price}
                  >
                    {service.price}
                  </div>
                  <div
                    className="management-services-modal__cell"
                    role="cell"
                    data-label={t.management.servicesModal.status}
                  >
                    <span className={statusClassName}>{statusLabel}</span>
                  </div>
                  <div
                    className="management-services-modal__cell management-services -modal__cell--action"
                    role="cell"
                    data-label={t.management.servicesModal.actions}
                  >
                    <button
                      className="management-services-modal__edit-button"
                      type="button"
                      onClick={() => openEditForm(service)}
                    >
                      {t.management.servicesModal.edit}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <TableFooter
          currentPage={safeCurrentPage}
          perPage={SERVICES_PER_PAGE}
          totalItems={visibleServices.length}
          onPageChange={setCurrentPage}
        />

        {!visibleServices.length ? (
          <p className="management-services-modal__empty">
            {t.management.servicesModal.empty}
          </p>
        ) : null}
      </section>
    </div>
  );
}
